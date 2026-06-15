# 统一响应拦截（Unified Response）— 阶段 0.2

> 目标：把 controller 里散落的 `return { code: 200, data: ... }` / `throw new Error()` 收敛到统一 shape，便于前端 / 文档 / 错误监控。

---

## 1. 契约

| 状态 | shape | 含义 |
| --- | --- | --- |
| 成功 | `{ code: 200, data: T }` | 业务成功，`T` 是负载 |
| 业务失败 | `{ code: <num>, msg: string }` | **不会**抛到 koa 500；走统一 shape |
| 内部错误 | (koa 默认 500) | 不在本次范围，**不**动 |

- `code` 字段为 `number`，前端习惯 `code !== 200` 即失败、`code === 0` 即业务失败。
- `msg` 字段为 `string`，可读，给前端直接弹窗用。
- 兼容老前端：所有现有 `return { code: 200, data }` 都不动；本次只在 1 个方法上 pilot。

---

## 2. 用法

### 2.1 装饰器（推荐）

```ts
import { Wrap } from '../middleware/response';
import { ok } from '../util/response';
import { BizCode, BizError } from '../util/errors';

@Provide()
@Controller('/auth')
export class AuthController {
  @Post('/login')
  @Wrap()                                       // ← 加在方法上
  async userLogin(@Body(ALL) user: UserInfo) {
    const result = await this.UserService.getUser(user.user);
    if (!result) {
      throw new BizError(BizCode.NOT_FOUND, '用户未注册');
    }
    if (result.passwd !== this.Util.Crypto_Encrypto(user.passwd)) {
      throw new BizError(BizCode.BIZ_ERROR, '密码错误，请核对密码');
    }
    result.passwd = '';
    const token = await this.Util.Secret_JwtSign(result.toJSON());
    return ok({ token, user });                 // ← 直接 return 成功 shape
  }
}
```

### 2.2 函数式（旧方法 inline 改造）

```ts
@Post('/foo')
async foo(@Body() x: any) {
  return wrapAsync.call(this, async () => {
    const data = await this.SomeService.do(x);
    return ok(data);
  });
}
```

### 2.3 工具函数

```ts
import { ok, fail, toFailResponse } from '../util/response';
import { BizCode } from '../util/errors';

ok({ id: 1 })                                  // → { code: 200, data: { id: 1 } }
fail('非法操作')                                // → { code: 0, msg: '非法操作' }
fail('需要登录', BizCode.UNAUTHORIZED)          // → { code: 401, msg: '需要登录' }
toFailResponse(new Error('x'))                 // → { code: 0, msg: 'x' }
```

---

## 3. 错误体系（`src/util/errors.ts`）

```ts
export const BizCode = {
  BIZ_ERROR: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export class BizError extends Error {
  public readonly code: BizCodeValue;
  public readonly reason: string;
  constructor(code: BizCodeValue = BizCode.BIZ_ERROR, reason?: string) { ... }
  toResponse() { return { code: this.code, msg: this.reason }; }
}
```

使用：

```ts
throw new BizError(BizCode.NOT_FOUND, '新闻不存在');
throw new BizError(BizCode.FORBIDDEN);              // 自动用默认 msg: '无权限'
throw new BizError('用户未注册');                   // code 默认 0
```

---

## 4. Wrap 装饰器行为表

| 业务方法返回 / 抛出 | Wrap 后响应 |
| --- | --- |
| `return ok({...})`                       | `{ code: 200, data: {...} }` （透传） |
| `return fail('xx', 401)`                  | `{ code: 401, msg: 'xx' }` （透传） |
| `return { code: 200, data: {...} }`       | 原样透传（已 shape 不重包） |
| `return { token, user }`                  | `{ code: 200, data: { token, user } }` （自动包成 ok） |
| `return 123`                              | `{ code: 200, data: 123 }` |
| `throw new BizError(404, '不存在')`        | `{ code: 404, msg: '不存在' }` |
| `throw new Error('崩了')`                 | `{ code: 0, msg: '崩了' }` |

识别"已 shape"的规则（避免重复包装）：
- `code` 必须是 `number`；
- `code === 200` 时必须含 `data` 字段；
- `code !== 200` 时必须含 `msg: string`。

---

## 5. 阶段 0.2 落地范围（本次）

- ✅ 新增 `src/util/errors.ts`、`src/util/response.ts`、`src/middleware/response.ts`
- ✅ `AuthController.userLogin` 改成 wrap 风格（pilot）
- ✅ `scripts/smoke.sh` 兼容 `.data.token`（同时 fallback `.token`）
- ❌ 其它 controller / service **暂不动**
- ❌ koa 默认 500 行为 **不动**

---

## 6. 阶段 0.3+ 推广建议

按以下顺序铺开（每个模块迁移完 → 跑 smoke → 改前端 → 全量切流量）：

1. **先把内部写入类接口**（setXxx、delXxx）迁完——它们最有"非 0 失败"语义；
2. **再迁** 读取类（getXxx）——这类最简单，全部 ok() 即可；
3. **最后** 鉴权 / 登录类——`/auth/login` 已先迁作 pilot，剩下 `/auth/wxlogin` 等。

每个 controller 迁移步骤：
1. 在文件顶部 import `{ Wrap }`、`{ ok, fail }`、`{ BizCode, BizError }`；
2. 把方法都加上 `@Wrap()`；
3. 替换 `return { code: 200, data: ... }` → `return ok(...)`；
4. 替换 `return { code: 0, msg: 'xx' }` → `throw new BizError(BizCode.BIZ_ERROR, 'xx')`；
5. 替换 `throw new Error('xx')` → `throw new BizError(BizCode.BIZ_ERROR, 'xx')`（或选更准的 code）；
6. 跑 `pnpm run lint` + `pnpm run build` + `./scripts/smoke.sh`；
7. 跑完再合 PR。

> ⚠️ 兼容性提醒：本次 pilot 把 `/auth/login` 的成功响应从 `{ token, user }` 改成了 `{ code: 200, data: { token, user } }`。`ladis-admin` 当前 `pages/wxlogin.vue:64,79` 用的是 `el.token`（顶层取），可能会受影响。
> **铺开前必须先动 ladis-admin 改成 `el.data.token`**，否则前端会拿不到 token 直接挂掉。

---

## 7. 未来扩展（不在 0.2 范围）

- 把 `toFailResponse` 挂到全局 koa errorHandler，让 `throw new Error()` 也走统一 shape（**当前不动**）；
- 加 `wrap()` 的"自动 schema 校验"开关，配合 `@Validate()` 失败时直接抛 `BizError(400, ...)`；
- 错误监控：把 `BizError` 上报 sentry / 自家埋点。
