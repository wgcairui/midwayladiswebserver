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

/**
 * 分页响应 envelope. data 字段是分页结果, 包含 items + 分页元数据.
 *
 * 设计目标:
 *  - 前端分页组件 (el-pagination) 只需要 el.data.total + el.data.items
 *  - 行为 100% 等价老接口 (items 是分页后的数组, 老 caller 改用 .items 替代 .data 本身)
 *  - 不破坏现有 list 接口的"全量"行为: 当 caller 不传 page/pageSize 时 page=1, pageSize=20
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * 规范化分页参数. 缺省值: page=1, pageSize=20. 越界兜底.
 */
export function normalizePagination(p: PaginationParams = {}): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, Math.floor(Number(p.page) || DEFAULT_PAGE));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(p.pageSize) || DEFAULT_PAGE_SIZE))
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function ok<T = unknown>(data: T): OkResponse<T> {
  return { code: 200, data };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number): OkResponse<Paginated<T>> {
  return { code: 200, data: { items, total, page, pageSize } };
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
