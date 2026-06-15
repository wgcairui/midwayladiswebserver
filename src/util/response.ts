/**
 * 统一响应 shape 工具（阶段 0.2）
 *
 * 成功：{ code: 200, data: T }
 * 失败：{ code: number, msg: string }
 *
 * 约束（来自任务说明）：
 *  - 不破坏现有返参 shape（成功仍 { code: 200, data }）
 *  - 失败允许 { code: 0, msg: 'xxx' } 兼容旧前端
 *  - 不动 koa 默认 500 行为；这一层只在 wrap 装饰器内被主动调用
 *
 * 用法（在 controller 里直接 return）：
 *    return ok({ id: 1 });
 *    return fail('非法操作');                      // 默认 code=0
 *    return fail('需要登录', BizCode.UNAUTHORIZED);
 *    throw new BizError(BizCode.NOT_FOUND, 'xx'); // wrap 装饰器捕获并转 fail
 */

import { BizCode, BizError, BizCodeValue } from './errors';

export interface OkResponse<T = unknown> {
  code: 200;
  data: T;
}

export interface FailResponse {
  code: number;
  msg: string;
}

export type ApiResponse<T = unknown> = OkResponse<T> | FailResponse;

export function ok<T = unknown>(data: T): OkResponse<T> {
  return { code: 200, data };
}

export function fail(msg: string, code: BizCodeValue = BizCode.BIZ_ERROR): FailResponse {
  return { code, msg };
}

/**
 * 把任意抛出的东西规范化成 FailResponse。
 *  - BizError → { code: e.code, msg: e.reason }
 *  - 其他 Error → { code: 0, msg: e.message }（前端习惯把 0 当失败；不动 500）
 *  - 非 Error → { code: 0, msg: String(x) }
 */
export function toFailResponse(err: unknown): FailResponse {
  if (err instanceof BizError) {
    return err.toResponse();
  }
  if (err instanceof Error) {
    return { code: BizCode.BIZ_ERROR, msg: err.message || '业务错误' };
  }
  return { code: BizCode.BIZ_ERROR, msg: String(err) };
}
