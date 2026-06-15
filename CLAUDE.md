# CLAUDE.md

> midwayladiswebserver 项目的 Claude / agent 协作指南。覆盖项目结构、技术栈、常用命令、部署、踩坑记录。

---

## 项目概览

- **项目名**：midwayladiswebserver（v1.1.0）
- **类型**：后端业务服务（Midway 2 + Koa）
- **目标**：为 [ladis-admin](../ladis-admin) 和 [ladisSite](../ladisSite) 提供业务 API，对应 `https://www.ladishb.com/site/`
- **依赖外部资源**：MongoDB（默认连 `127.0.0.1:27017/ladis`；docker 部署时 `mongo:27017/ladis`）

---

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 框架 | Midway 2.13.4 | 基于 Koa 2 |
| 视图 | Koa 2 + `@koa/cors` | `cors({ origin: '*' })` |
| Body | `koa-body` | multipart 上传，formidable 100M × 100 |
| 状态 | 无状态服务 | session / jwt 用 `jsonwebtoken` |
| 数据库 | MongoDB（mongoose 7 + @midwayjs/typegoose 2.13.5） | |
| 缓存 | `@midwayjs/cache`（in-memory） | 默认 `max: 1000, ttl: 6000` |
| 语言 | TypeScript 4 | 严格模式 + 装饰器 |
| 依赖管理 | **pnpm**（注意：不是 npm） | 锁文件 `pnpm-lock.yaml` |
| 构建 | `midway-bin build -c` → `dist/` | |
| 入口 | `bootstrap.js` | 写死 `port: 9007` |
| 工具 | `axios` / `cheerio` / `crypto-js` / `formidable` / `node-fetch` | |

---

## 目录结构

```
midwayladiswebserver/
├── src/
│   ├── controller/      # 路由（api / auth / docment / file / home / site / siteConfig）
│   ├── service/         # 业务（agent / user / cache / file / docment / wxOpen / ContentCaseNewCache）
│   ├── pip/             # 依赖注入扩展
│   ├── entity/          # Typegoose 实体
│   ├── dto/             # 入参/出参
│   ├── middleware/      # Koa middleware
│   ├── aspect/          # 切面
│   ├── util/            # 工具
│   ├── config/          # 配置（config.default.ts）
│   ├── interface.ts
│   └── configuration.ts # 生命周期 / imports
├── dist/                # build 产物
├── static/              # 静态资源（volume 挂载，不进镜像）
├── test/                # 单测
├── types/               # 全局 d.ts
├── bootstrap.js         # 入口
├── tsconfig.json
├── Dockerfile           # 多阶段
├── docker-compose.yml
├── deploy.sh            # 裸机部署
├── .env.example
└── package.json
```

---

## 常用命令

```bash
# 本地开发（需要本机起 Mongo，:27017）
pnpm run dev

# 构建（产物在 dist/）
pnpm run build

# 生产启动
pnpm run start

# 单测
pnpm run test
pnpm run cov           # 覆盖率

# Lint
pnpm run lint
pnpm run lint:fix

# Docker 镜像构建
pnpm run build:docker  # 等价于 docker compose build

# Docker 启停（标准 compose）
docker compose up -d --build
docker compose logs -f midwayladiswebserver
docker compose restart midwayladiswebserver
docker compose down

# 裸机部署（无 Docker）
./deploy.sh install
./deploy.sh start
./deploy.sh status
./deploy.sh logs
./deploy.sh stop
./deploy.sh restart
./deploy.sh uninstall
```

---

## 关键配置说明

### `bootstrap.js`
- 写死 `port: 9007`（**不是**从 env 读）
- 启动 Koa framework + Bootstrap

### `src/config/config.default.ts`
- **Mongo URI 切 host**：`process.env.NODE_Docker === 'docker' ? 'mongo' : '127.0.0.1'`
- 缓存默认 `max: 1000, ttl: 6000`（in-memory）
- CORS `origin: '*'`（无 credentials）

### `src/configuration.ts`
- `imports: [typegoose, cache]`
- 装 `bodyParser`（multipart: true, formidable 100M × 100）+ `cors`
- `conflictCheck: true`（重复注入会启动失败）

### 环境变量

| 变量 | 作用 | 默认 | 注入方式 |
|---|---|---|---|
| `NODE_ENV` | 运行环境 | `production` | docker-compose / `npm start` |
| `NODE_Docker` | Mongo host 切换标志 | `docker` | docker-compose / deploy.sh |
| `HTTP_PORT` | 宿主机端口 | `9007` | `.env` |

---

## 部署

### 本地验证（Docker 流程）

```bash
docker build -t midwayladiswebserver:1.1.0 .
docker run -d --name midwayladiswebserver-test -p 9007:9007 midwayladiswebserver:1.1.0
curl -I http://127.0.0.1:9007/   # 404 / 401 都算活（midway 不会空返）
```

> 注意：本服务强依赖 Mongo。**容器起来后访问任何路由都会卡住或报错**，因为 `mongo:27017` 在 compose 里没配（生产是独立 Mongo）。本地 docker run 验证只能确认**进程能起来、端口能监听**，不能验证业务连通性。

### 服务器部署（docker compose）

```bash
# 首次部署
cp .env.example .env
vi .env   # 改 HTTP_PORT（如需）

docker compose up -d --build

# 查看状态
docker compose ps
docker compose logs -f midwayladiswebserver

# 升级
git pull
docker compose up -d --build

# 停服
docker compose down
```

### 服务器部署（裸机）

```bash
# 首次
./deploy.sh install
./deploy.sh start

# 升级
git pull
./deploy.sh restart

# 状态 / 日志
./deploy.sh status
./deploy.sh logs
```

要求 Node 22+ 和 pnpm。

### 镜像分层（Dockerfile）
1. `node:24-alpine AS deps` — 装全量依赖（含 dev）
2. `node:24-alpine AS builder` — `midway-bin build` 到 `dist/`
3. `node:24-alpine AS prod-deps` — 单独 prune 出 prod deps（避免污染 dist 拷贝）
4. `node:24-alpine AS runner` — 拷贝 dist + prod deps + bootstrap；非 root 用户 `app`（uid 1001）运行

> 与 ladis-admin / ladisSite 同结构，但多了一层 `prod-deps`，因为 Midway 编译产物是 `dist/`，不需要全量 node_modules。

### 反向代理
9007 端口不应直接暴露公网，**建议在 nginx / caddy 后面跑 HTTPS**。

---

## 踩坑记录

- **Node 版本**：项目原 Dockerfile 用 `node:16-alpine`（已 EOL）。现统一升级到 `node:24-alpine`。本地开发建议也用 nvm 切到 22 / 24。
- **`pnpm` vs `npm`**：项目锁文件是 `pnpm-lock.yaml`。Docker build 必须用 pnpm，否则 lock 不同步。`corepack enable && corepack prepare pnpm@latest --activate` 即可，无需手装。
- **不要在 build 阶段删 devDeps**：`midway-bin build` 跑 TS 编译 + 配置生成时需要部分 devDeps（typescript / @midwayjs/cli / ts 类型）。**prod prune 单独走一层 `prod-deps`**，不在 `builder` 里 prune。
- **`static/` 不进镜像**：通过 volume 挂载。镜像层只建空目录占位 + chown。
- **Mongo host 切换**：`config.default.ts` 已经做了 `process.env.NODE_Docker` 判断。`docker-compose.yml` 必须设 `NODE_Docker=docker` 让服务连 `mongo` 容器名（或外部 Mongo DNS）。
- **port 写死 9007**：在 `bootstrap.js` 改的，不是从 `process.env.PORT` 读。如果要改端口，得改源码（**这跟 ladis-admin / ladisSite 的 env 驱动不同**）。
- **`tests` 目录被 .dockerignore 排除**：避免单测代码进镜像。如需在镜像里跑测试，临时取消 ignore。
- **`surge.sh` 之类的一键脚本**：`deploy.sh` 已经覆盖；不要复制 `package.json` 里旧的 `sudo docker run ...` 命令。
- **NPM 脚本里的 `sudo`**：老 `run:docker` 用了 sudo，新 compose 流程下用不上（普通用户加入 docker 组即可）。`build:docker` 已改为 `docker compose build`。

---

## 业务模块索引

| 路由前缀 | 文件 | 功能 |
|---|---|---|
| `/api` | `controller/api.ts` | 通用 API |
| `/auth` | `controller/auth.ts` | 登录 / token |
| `/docment` | `controller/docment.ts` | 文档管理 |
| `/file` | `controller/file.ts` | 文件上传 / 下载 |
| `/home` | `controller/home.ts` | 首页数据 |
| `/site` | `controller/site.ts` | 站点配置 |
| `/siteConfig` | `controller/siteConfig.ts` | 站点设置 |
| `/pip/crawler` | `pip/crawler.ts` | 注入式爬虫 |

---

## 协作约定

- **新功能 / 重构** 优先在 feature 分支开 PR，**不要直接 push main**
- **改 `bootstrap.js` 端口** 影响部署契约，必须先通知
- **改 `config.default.ts` 的 Mongo URI 逻辑** 涉及所有部署形态，必须本地用 docker compose 跑通
- **改 `Dockerfile` 多阶段顺序** 必须本地 `docker compose build` 验证
- **加新 controller** 后记得在 `src/controller/` 里注册 + 写 `test/controller/`

---

## 关联项目

- **前端后台**：[ladis-admin](../ladis-admin)（Nuxt 2 SPA，调用本服务 `/auth` `/api` `/upload` 等）
- **官网前端**：[ladisSite](../ladisSite)（Nuxt 2 SSR，调用本服务）
- **同作者**：
  - `uart-server`（Node.js + Express + Socket.IO，IoT 设备管理后端，主战场）
  - `uart-site-v3`（Next.js 15 + Bun，新一代）
