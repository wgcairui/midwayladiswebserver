#!/usr/bin/env bash
# scripts/smoke.sh
#
# 阶段 0.1：smoke 安全网。端到端覆盖：
#   1) GET / 期望 "Hello Midwayjs!"
#   2) POST /auth/login 用 seed 的 admin 账号
#   3) 拿 token 调几个只读 POST /api/* (news / case / buys / softs / links)
#   4) GET 公开路由 /web/getCaseLists?site=smoke 等
#   5) GET /config/agent?name=smoke 公开配置
#
# 依赖：
#   - bash 4+（macOS 自带 3.2 兼容，但避免用 mapfile 等 4+ 特性）
#   - curl, jq
#   - 本地 mongodb 跑在 127.0.0.1:27017
#   - 服务跑在 :9007 (默认 bootstrap.js)
#
# 环境变量（可覆盖默认值）：
#   HOST        default 127.0.0.1
#   PORT        default 9007
#   HOST_HEADER 默认空（公开 site 路由需要 name: smoke 头，由本脚本注入）
#   SEED_USER   default smoke
#   SEED_PASS   default smoke123
#   SITE        default smoke
#
# 用法：
#   ./scripts/smoke.sh
#   PORT=9008 ./scripts/smoke.sh
#
# 退出码：任何一步失败立即 exit 1（set -e）

set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-9007}"
BASE="http://${HOST}:${PORT}"
SEED_USER="${SEED_USER:-smoke}"
SEED_PASS="${SEED_PASS:-smoke123}"
SITE="${SITE:-smoke}"
MONGO_URL="${SMOKE_MONGO_URL:-mongodb://127.0.0.1:27017/ladis}"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
blue()  { printf "\033[34m%s\033[0m\n" "$*"; }

# 简易 HTTP 调用：把 body 写到 $BODY_FILE，HTTP code 写到 $CODE_FILE
http() {
  # usage: http METHOD PATH [DATA] [EXTRA_HEADER...]
  local method="$1" path="$2" data="${3:-}"
  shift 3 || shift 2
  local tmp_body tmp_code
  tmp_body=$(mktemp)
  tmp_code=$(mktemp)
  if [[ -n "$data" ]]; then
    curl -sS -o "$tmp_body" -w '%{http_code}' \
      -X "$method" -H 'Content-Type: application/json' "$@" \
      --data "$data" "${BASE}${path}" > "$tmp_code"
  else
    curl -sS -o "$tmp_body" -w '%{http_code}' \
      -X "$method" "$@" "${BASE}${path}" > "$tmp_code"
  fi
  CODE=$(cat "$tmp_code")
  BODY=$(cat "$tmp_body")
  rm -f "$tmp_body" "$tmp_code"
}

# 解析 cookie 中的 token，便于后续请求 cookie 鉴权（tokenParse 中间件读 cookie）
extract_token_from_body() {
  # POST /auth/login 阶段 0.2 之后被 @Wrap() 包了：
  #   成功 → { code: 200, data: { token, user } }
  #   失败 → { code, msg }
  # 这里兼容两种 shape：优先 .data.token，回退到顶层 .token
  echo "$1" | jq -r '.data.token // .token // empty'
}

assert_eq() {
  # usage: assert_eq <expected> <actual> <label>
  if [[ "$1" != "$2" ]]; then
    red "✗ $3 expected=[$1] actual=[$2]"
    exit 1
  fi
  green "✓ $3 = $1"
}

assert_contains() {
  # usage: assert_contains <needle> <haystack> <label>
  if [[ "$2" != *"$1"* ]]; then
    red "✗ $3 expected to contain [$1], got [$2]"
    exit 1
  fi
  green "✓ $3 contains [$1]"
}

assert_code_2xx() {
  # usage: assert_code_2xx <code> <label>
  local code="$1" label="$2"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    red "✗ $label HTTP=$code body=$BODY"
    exit 1
  fi
  green "✓ $label HTTP=$code"
}

assert_jq_data_array_nonempty() {
  # usage: assert_jq_data_array_nonempty <label>
  local label="$1"
  local len
  len=$(echo "$BODY" | jq -r '.data | length' 2>/dev/null || echo "ERR")
  if [[ "$len" == "ERR" || "$len" -lt 1 ]]; then
    red "✗ $label data 数组为空或 shape 异常 body=$BODY"
    exit 1
  fi
  green "✓ $label data.length=$len"
}

# ----- 预检查 -----
blue "[smoke] target=${BASE} user=${SEED_USER} site=${SITE}"
for bin in curl jq node; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    red "✗ 缺依赖：$bin"
    exit 1
  fi
done

# 自动 seed（如已存在则 upsert，不影响业务数据）
blue "[seed] upsert smoke data into mongo (${MONGO_URL})"
SEED_OUT=$(node -e "
const m = require('mongoose');
const C = require('crypto-js');
const K = C.enc.Utf8.parse('94nxeywgxwbakx83');
const V = C.enc.Utf8.parse('xheg73k0kxhw83nx');
const enc = (w) => C.AES.encrypt(C.enc.Utf8.parse(w), K, {iv:V, mode:C.mode.CBC, padding:C.pad.Pkcs7}).ciphertext.toString().toUpperCase();
(async () => {
  await m.connect(process.env.SMOKE_MONGO_URL || 'mongodb://127.0.0.1:27017/ladis');
  const db = m.connection.db;
  const now = new Date();
  await db.collection('users').updateOne({user:'smoke'}, {\$set:{user:'smoke', name:'smoke', passwd:enc('smoke123'), userGroup:'admin', company:'smoke', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('news').updateOne({title:'smoke-news-title'}, {\$set:{title:'smoke-news-title', text:'smoke-news-text', name:'smoke-news-name', time:'2024-01-01', img:'', href:'', MainTitle:'smoke', company:'smoke', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('news_lists').updateOne({title:'smoke-news-title'}, {\$set:{title:'smoke-news-title', content:'smoke-news-content', link:'smoke-news-link', company:'smoke', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('cases').updateOne({title:'smoke-case-title'}, {\$set:{title:'smoke-case-title', text:'smoke-case-text', name:'smoke-case-name', time:'2024-01-01', img:'', href:'', MainTitle:'smoke', company:'smoke', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('case_lists').updateOne({title:'smoke-case-title'}, {\$set:{title:'smoke-case-title', content:'smoke-case-content', link:'smoke-case-link', company:'smoke', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('agentconfigs').updateOne({name:'smoke'}, {\$set:{name:'smoke', url:'http://smoke.test', contactTel:['13000000000'], share:true, updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('linkfrends').updateOne({name:'smoke-link'}, {\$set:{name:'smoke-link', link:'https://smoke.test', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await db.collection('supports').updateOne({title:'smoke-soft'}, {\$set:{title:'smoke-soft', type:'windows', updatedAt:now}, \$setOnInsert:{createdAt:now}}, {upsert:true});
  await m.disconnect();
  console.log('seed ok');
})().catch(e => { console.error(e.message); process.exit(1); });
" 2>&1)
if [[ "$SEED_OUT" != *"seed ok"* ]]; then
  red "✗ seed 失败：$SEED_OUT"
  exit 1
fi
green "✓ seed done"

# 等待服务起来（最多 30s）
blue "[smoke] 等待服务 :${PORT} 起来…"
for i in $(seq 1 30); do
  if curl -sS -o /dev/null -w '%{http_code}' "${BASE}/" 2>/dev/null | grep -qE '^(2|4)'; then
    break
  fi
  sleep 1
done
if ! curl -sS -o /dev/null -w '%{http_code}' "${BASE}/" 2>/dev/null | grep -qE '^(2|4)'; then
  red "✗ 服务在 :${PORT} 没起来，跑：cd $(pwd) && pnpm run start 或 pnpm run dev"
  exit 1
fi

# ----- 1) GET / -----
blue "[1/5] GET /"
http GET /
assert_eq "200" "$CODE" "GET / status"
assert_contains "Hello Midwayjs" "$BODY" "GET / body"

# ----- 2) /auth/login -----
blue "[2/5] POST /auth/login"
LOGIN_PAYLOAD=$(jq -nc --arg u "$SEED_USER" --arg p "$SEED_PASS" \
  '{user: $u, passwd: $p}')
http POST /auth/login "$LOGIN_PAYLOAD"
assert_code_2xx "$CODE" "login"
TOKEN=$(extract_token_from_body "$BODY")
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  red "✗ /auth/login 没返回 token，body=$BODY"
  exit 1
fi
green "✓ token len=${#TOKEN}"

# token 注入 cookie（tokenParse 中间件从 cookie auth._token.local 读）
COOKIE="auth._token.local=false%20${TOKEN}"
AUTH_HEADERS=(-H "Cookie: ${COOKIE}")

# ----- 3) 几个只读接口 -----
blue "[3/5] POST /api/getNewsList (with token)"
http POST /api/getNewsList '{"site":"smoke"}' "${AUTH_HEADERS[@]}"
assert_code_2xx "$CODE" "getNewsList"
assert_jq_data_array_nonempty "getNewsList"

blue "[3/5] POST /api/getCaseList (with token)"
http POST /api/getCaseList '{"site":"smoke"}' "${AUTH_HEADERS[@]}"
assert_code_2xx "$CODE" "getCaseList"
assert_jq_data_array_nonempty "getCaseList"

blue "[3/5] POST /api/getBuys"
http POST /api/getBuys '' "${AUTH_HEADERS[@]}"
assert_code_2xx "$CODE" "getBuys"
# buys 可能为空数组，只校验 data 是数组即可
if ! echo "$BODY" | jq -e '.data | type=="array"' >/dev/null; then
  red "✗ getBuys data 不是数组 body=$BODY"
  exit 1
fi
green "✓ getBuys data is array"

blue "[3/5] POST /api/getSofts"
http POST /api/getSofts '' "${AUTH_HEADERS[@]}"
assert_code_2xx "$CODE" "getSofts"
if ! echo "$BODY" | jq -e '.data | type=="array"' >/dev/null; then
  red "✗ getSofts data 不是数组 body=$BODY"
  exit 1
fi
green "✓ getSofts data is array"

blue "[3/5] POST /api/getLinks"
http POST /api/getLinks '' "${AUTH_HEADERS[@]}"
assert_code_2xx "$CODE" "getLinks"
if ! echo "$BODY" | jq -e '.data | type=="array"' >/dev/null; then
  red "✗ getLinks data 不是数组 body=$BODY"
  exit 1
fi
green "✓ getLinks data is array"

# ----- 4) 公开 site 路由 -----
blue "[4/5] GET /web/getCaseLists?site=${SITE}"
http GET "/web/getCaseLists?site=${SITE}" '' -H "name: ${SITE}"
assert_code_2xx "$CODE" "getCaseLists public"
if ! echo "$BODY" | jq -e 'type=="array"' >/dev/null; then
  red "✗ getCaseLists 公开返回不是数组 body=$BODY"
  exit 1
fi
green "✓ getCaseLists public is array"

blue "[4/5] GET /web/getNewsLists?site=${SITE}"
http GET "/web/getNewsLists?site=${SITE}" '' -H "name: ${SITE}"
assert_code_2xx "$CODE" "getNewsLists public"
if ! echo "$BODY" | jq -e 'type=="array"' >/dev/null; then
  red "✗ getNewsLists 公开返回不是数组 body=$BODY"
  exit 1
fi
green "✓ getNewsLists public is array"

# ----- 5) /config/agent -----
blue "[5/5] GET /config/agent?name=${SITE}"
http GET "/config/agent?name=${SITE}"
assert_code_2xx "$CODE" "config/agent"
green "✓ /config/agent name=${SITE} OK"

green "==================="
green "SMOKE 全部通过 ✓"
green "==================="
