# 依赖升级记录（chore/upgrade-deps）

> 升级策略：**分档 + 每档 smoke 验证**。每档必须 `pnpm run build` + `./scripts/smoke.sh` 全绿才能进入下一档。

## 目标 Node 版本
本机 node v22.20.0、pnpm 11.5.2、Dockerfile 用 `node:24-alpine`。`@types/node` 升到 22。

## 升级前安全网

- ✅ `scripts/smoke.sh` + `scripts/seed-smoke.ts` 已在 stage-0-1 分支验证可用
- ✅ mongod 临时跑 27017 即可

## 分档计划

### 档位 A：runtime 依赖补丁（高优）
| 包 | 当前 | 目标 | 风险 | 备注 |
|---|---|---|---|---|
| `axios` | ^0.21.1 | ^1.7.0 | 低（API 兼容） | 0.21 已知 EOL |
| `formidable` | ^2.1.1 | ^3.5.0 | 中（types 变） | 2.x 有 cve，3.x API 微调 |
| `node-fetch` | ^2.6.1 | ^3.3.0 | **高**（CJS→ESM） | 2.x EOL；3.x 是 ESM only，**必须用 dynamic import** |
| `mongoose` | ^7.0.0 | ^8.0.0 | 中（connect 行为） | 7→8 breaking，8 默认 `strictQuery` 关闭、buffering 行为有变 |
| `@types/node` | 16 | 22 | 低 | 跟本机 Node 22 对齐 |
| `@types/node-fetch` | ^2.5.10 | （删除） | — | 3.x 自带 types |

### 档位 B：dev tooling（中优）
| 包 | 当前 | 目标 | 备注 |
|---|---|---|---|
| `typescript` | ^4.0.0 | ^5.4.0 | 大跳，会触发 d.ts 解析变化 |
| `jest` | ^26.4.0 | ^29.7.0 | 跟 ts-jest 29 配套 |
| `ts-jest` | ^26.2.0 | ^29.1.0 | |
| `@types/jest` | ^26.0.10 | ^29.5.0 | |
| `@types/koa` | ^2.13.6 | ^2.15.0 | |
| `@types/cheerio` | ^0.22.29 | ^0.22.35 | |
| `@types/jsonwebtoken` | ^8.5.1 | ^9.0.0 | jwt 8→9 是 type only |
| `@types/crypto-js` | ^4.0.1 | ^4.2.0 | |
| `@types/cache-manager` | ^3.4.0 | ^4.0.0 | cache-manager 4.x 是 ESM only，**types 跟随** |
| `@types/rimraf` | ^3.0.0 | ^4.0.0 | rimraf 4 是 ESM only |
| `rimraf` | ^3.0.2 | ^4.4.0 | |
| `cross-env` | ^6.0.0 | ^7.0.3 | |
| `cache-manager` | ^3.4.3 | ^5.7.0 | **大跳**——`@Inject() cache: CacheManager` 的接口会变 |

### 档位 C：不动（锁定）
| 包 | 原因 |
|---|---|
| `midway 2.13.4` 全家桶 | 跨大版本独立 PR |
| `@typegoose/typegoose 11` | 跟 midway 2.13 锁 |
| `@koa/cors` | 没问题 |
| `cheerio` | 没问题 |
| `class-validator` | 没问题 |
| `crypto-js` | 没问题 |
| `jsonwebtoken` | 8.5 还行 |
| `koa-body` | 4.2 还行 |
| `@cairui/wx-sdk` / `types-uart` | 内部分发，不动 |
| `@midwayjs/luckyeye` / `mwts` | 5 年没更新但是工具，不动；**如果 A+B 跑过且不再被用到，单独 PR 删** |
| `@midwayjs/cli` | 跟 midway 锁 |
| `@midwayjs/mock` | 跟 midway 锁 |

## 升级流程

1. 改 `package.json`（**手改，不要 pnpm up 一次性**——pnpm 11 默认只升 lock 里有的，复杂）
2. `pnpm install` 触发 lock 重算
3. 跑 `pnpm run build` —— 主要看 ts 错误
4. 跑 `scripts/seed-smoke.ts`（绕过 tsc 用 node 跑）和 `scripts/smoke.sh`
5. 任何一步挂 → 排查 → 决定降级或修代码
6. 每档全绿后 commit，再进下一档

## 不接受的范围

- ❌ midway 主版本升级（独立 PR）
- ❌ typegoose 主版本升级（独立 PR）
- ❌ `class-validator` 升 0.15+（schema 链 API 变更太大，独立 PR）
- ❌ `node-fetch` 替换成内置 fetch（ESM 改造跨大，独立 PR）
