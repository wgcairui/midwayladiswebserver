#!/usr/bin/env bash
# ==============================================================================
# midwayladiswebserver 裸机部署单文件脚本
#
# 适用场景：目标机器没装 Docker / 不想用 Docker / 临时部署
# 行为：
#   - 从 .env 加载环境变量（不存在则提示创建）
#   - 检测 Node.js（要求 22+），自动 pnpm install + midway-bin build
#   - 用 setsid + nohup 把 bootstrap.js 放到后台跑（不依赖 pm2 / systemd）
#   - PID 写入 .run/midwayladiswebserver.pid，日志写入 logs/midwayladiswebserver.log
#   - 端口默认 9007（bootstrap.js 写死）
#
# 使用：
#   ./deploy.sh install    # 装依赖 + build（首次或升级后）
#   ./deploy.sh start      # 启动后台进程
#   ./deploy.sh stop       # 停服
#   ./deploy.sh restart    # 重启
#   ./deploy.sh status     # 状态
#   ./deploy.sh logs       # tail -f 日志
#   ./deploy.sh uninstall  # 移除 build 产物和依赖
#
# 兼容：Linux（systemd-free / no Docker）、macOS
# ==============================================================================

set -euo pipefail

# ---- 路径 ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_DIR=".run"
PID_FILE="$PID_DIR/midwayladiswebserver.pid"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/midwayladiswebserver.log"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"
APP_NAME="midwayladiswebserver"

# ---- 颜色（如果终端支持）----
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi
log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $*"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $*" >&2; }

# ---- 检测 Node ----
require_node() {
  if ! command -v node >/dev/null 2>&1; then
    err "未找到 node。请先安装 Node.js 22+ （建议用 nvm: https://github.com/nvm-sh/nvm）"
    exit 1
  fi
  local ver
  ver=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [[ "$ver" -lt 22 ]]; then
    err "Node 版本 $(node -v) 过低，要求 22+。请升级（nvm install 22 && nvm use 22）"
    exit 1
  fi
}

# ---- 检测 pnpm ----
require_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then
    err "未找到 pnpm。请先安装（npm i -g pnpm 或 corepack enable）"
    exit 1
  fi
}

# ---- 加载 .env ----
load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$ENV_EXAMPLE" ]]; then
      warn ".env 不存在，自动从 .env.example 复制"
      cp "$ENV_EXAMPLE" "$ENV_FILE"
      warn "请编辑 $ENV_FILE 后重试"
      exit 1
    else
      err ".env 和 .env.example 都不存在"
      exit 1
    fi
  fi
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
  log "已加载 .env"
}

# ---- 是否在跑 ----
is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid=$(cat "$PID_FILE" 2>/dev/null || true)
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

# ---- 子命令 ----
cmd_install() {
  require_node
  require_pnpm
  load_env
  log "安装依赖（pnpm）..."
  pnpm install --frozen-lockfile
  log "构建（midway-bin build）..."
  pnpm run build
  ok "构建完成（dist/ 已就绪）"
}

cmd_start() {
  require_node
  if is_running; then
    warn "已在运行（PID $(cat "$PID_FILE")）"
    return 0
  fi
  if [[ ! -d node_modules ]]; then
    warn "node_modules 不存在，先跑 install"
    cmd_install
  fi
  if [[ ! -d dist ]]; then
    warn "dist/ 不存在，先跑 build"
    pnpm run build
  fi
  load_env

  mkdir -p "$PID_DIR" "$LOG_DIR"

  log "启动 $APP_NAME（端口 9007，NODE_Docker=${NODE_Docker:-未设置}）..."
  # setsid 脱离当前会话，nohup 免疫 SIGHUP，重定向到日志
  NODE_ENV=production NODE_Docker="${NODE_Docker:-docker}" \
    setsid nohup node ./bootstrap.js \
      > "$LOG_FILE" 2>&1 < /dev/null &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  sleep 2
  if is_running; then
    ok "已启动（PID $pid，日志 $LOG_FILE）"
  else
    err "启动失败，查看日志：$LOG_FILE"
    tail -20 "$LOG_FILE" || true
    exit 1
  fi
}

cmd_stop() {
  if ! is_running; then
    warn "未运行"
    rm -f "$PID_FILE"
    return 0
  fi
  local pid
  pid=$(cat "$PID_FILE")
  log "停止 PID $pid ..."
  kill -TERM "$pid" 2>/dev/null || true
  # 给 10s 优雅退出
  for _ in {1..10}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done
  if kill -0 "$pid" 2>/dev/null; then
    warn "10s 内未退出，发送 KILL"
    kill -KILL "$pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
  ok "已停止"
}

cmd_restart() {
  cmd_stop || true
  cmd_start
}

cmd_status() {
  if is_running; then
    local pid
    pid=$(cat "$PID_FILE")
    ok "运行中（PID $pid）"
    # 看下端口
    local port="${HTTP_PORT:-9007}"
    if command -v ss >/dev/null 2>&1; then
      ss -ltnp 2>/dev/null | grep -E ":$port\b" || warn "端口 $port 未监听"
    elif command -v netstat >/dev/null 2>&1; then
      netstat -ltnp 2>/dev/null | grep -E ":$port\b" || warn "端口 $port 未监听"
    fi
  else
    warn "未运行"
    return 1
  fi
}

cmd_logs() {
  if [[ ! -f "$LOG_FILE" ]]; then
    warn "日志文件不存在：$LOG_FILE"
    return 0
  fi
  tail -f "$LOG_FILE"
}

cmd_uninstall() {
  cmd_stop || true
  log "删除 node_modules / dist / .run / logs ..."
  rm -rf node_modules dist "$PID_DIR" "$LOG_DIR"
  ok "已清理"
}

cmd_help() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
}

# ---- 入口 ----
main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    install)   cmd_install "$@" ;;
    start)     cmd_start "$@" ;;
    stop)      cmd_stop "$@" ;;
    restart)   cmd_restart "$@" ;;
    status)    cmd_status "$@" ;;
    logs)      cmd_logs "$@" ;;
    uninstall) cmd_uninstall "$@" ;;
    help|-h|--help) cmd_help ;;
    *)
      err "未知命令：$cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
