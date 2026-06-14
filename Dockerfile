# ---------- Deps stage ----------
FROM node:24-alpine AS deps
WORKDIR /app

# 启用 pnpm（镜像带 corepack）
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 lockfile + manifest
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# 国内构建慢时启用：pnpm config set registry https://registry.npmmirror.com
# 允许 @midwayjs/cli / ejs 的 postinstall 脚本
RUN pnpm install --frozen-lockfile

# ---------- Build stage ----------
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 注入 build-time 用的 wxOpen key stub（仓库不持有真实凭证）
# 真实 src/key/key.ts 由部署机在 build 前注入到 bind mount / secret mount
# 这里建一个空文件让 tsc 能编译通过，避免 build 失败
RUN mkdir -p /app/src/key && \
    echo 'export const secret_wxOpen = { appid: "", secret: "" };' > /app/src/key/key.ts

# midway-bin build 把 src/ 编译到 dist/
RUN pnpm run build

# ---------- Prod deps stage ----------
# 单独抽一层用来 prune dev deps，避免污染 dist 拷贝
FROM node:24-alpine AS prod-deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
# 只装 prod 依赖，runner 不需要 devDeps
RUN pnpm install --prod --ignore-scripts

# ---------- Runner stage ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_Docker=docker

# 显式 uid/gid=1001，跟 ladis-admin / ladisSite / uart-site-v3 一致
RUN addgroup --system --gid 1001 app \
    && adduser --system --uid 1001 --ingroup app app

# 运行时只拷贝 dist + prod deps + bootstrap
COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=builder  --chown=app:app /app/dist         ./dist
COPY --from=builder  --chown=app:app /app/bootstrap.js ./bootstrap.js
COPY --from=builder  --chown=app:app /app/package.json ./package.json

# static/ 走 volume 挂载（不放进镜像）
RUN mkdir -p /app/static && chown app:app /app/static

USER app

# bootstrap.js 写死 :9007
EXPOSE 9007

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:9007/ >/dev/null 2>&1 || exit 1

CMD ["npm", "run", "start"]
