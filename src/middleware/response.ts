/**
 * 统一响应拦截（阶段 0.2）
 *
 * 用法 1 — 装饰器（推荐，跟方法装饰器风格一致）：
 *
 *    @Provide()
 *    @Controller('/auth')
 *    export class AuthController {
 *      @Post('/login')
 *      @Wrap()                                  // ← 加这一行
 *      async userLogin(@Body(ALL) user: UserInfo) {
 *        const result = await this.UserService.getUser(user.user);
 *        if (!result) throw new BizError(BizCode.NOT_FOUND, '用户未注册');
 *        ...
 *        return ok({ token, user });            // 直接 return 成功 shape
 *      }
 *    }
 *
 * 用法 2 — 函数式包一层（更适合旧方法 inline 改造）：
 *
 *    @Post('/foo')
 *    async foo(@Body() x: any) {
 *      return wrapAsync.call(this, async () => {
 *        ...
 *        return ok(data);
 *      });
 *    }
 *
 * 行为：
 *  - return ok({...})     → 200 { code: 200, data }
 *  - return fail(...)      → { code, msg }
 *  - return { code: 200, data }  → 原样保留（向后兼容 — 已写好的 controller 不动）
 *  - throw new BizError    → { code, msg }
 *  - throw new Error       → { code: 0, msg: e.message }（不上升到 500；这是约定）
 *
 * 注意：本次（阶段 0.2）只在 AuthController.userLogin 一个方法上铺开做示范，
 *       批量铺开放到阶段 0.3。已存在 controller 不动。
 */

import { BizError } from '../util/errors';
import { ok, toFailResponse } from '../util/response';

export const WRAP_METADATA_KEY = 'midway:wrap_response';

/**
 * 方法装饰器：把 controller 方法包一层统一响应拦截。
 */
export function Wrap(): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    if (typeof original !== 'function') {
      throw new Error('@Wrap() 只能装饰方法');
    }
    descriptor.value = async function wrapped(this: unknown, ...args: any[]) {
      try {
        const result = await original.apply(this, args);
        // 已经按统一 shape 返回（{code:200,data} / {code,msg} / ok()/fail()）— 原样透传
        if (isAlreadyShaped(result)) return result;
        // 兜底：业务方法 return 裸数据 → 自动包成 { code: 200, data }
        return ok(result);
      } catch (err) {
        if (err instanceof BizError) {
          return err.toResponse();
        }
        return toFailResponse(err);
      }
    };
    return descriptor;
  };
}

/**
 * 函数式版本。给非装饰器场景用，或者给单方法 inline 改。
 *   return wrapAsync.call(this, async () => { ... });
 */
export async function wrapAsync<T = any>(
  this: unknown,
  fn: () => Promise<T> | T,
): Promise<unknown> {
  try {
    const result = await fn();
    if (isAlreadyShaped(result)) return result;
    return ok(result);
  } catch (err) {
    if (err instanceof BizError) {
      return err.toResponse();
    }
    return toFailResponse(err);
  }
}

/**
 * 识别"已经是统一 shape"的返回值，避免重复包装。
 *  - 成功：{ code: 200, data: ... }    （注意：只有 code===200 且有 data 字段才算）
 *  - 失败：{ code: <非 200>, msg: string }
 *
 * 业务方法如果返回 { code: 200, data: { code: 200, data: ... } } 这种"巧合"也会被
 * 识别为已 shape，正常透传。这是可接受的。
 */
function isAlreadyShaped(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.code !== 'number') return false;
  if (obj.code === 200) return 'data' in obj;
  return typeof obj.msg === 'string';
}
