/**
 * 业务错误体系（阶段 0.2 引入）
 *
 * 设计目标：
 *  - 业务层抛 BizError，HTTP 层（在 wrap/中间件里）转成 { code, msg }。
 *  - code 字段用 number，向后兼容老前端
 *    （老前端习惯 code !== 200 / code === 0 表示失败）。
 *  - 保留 throw new Error() 的默认 500 行为不动（"不要碰 koa 默认"约束）。
 *
 * 用法：
 *    throw new BizError(BizCode.NOT_FOUND, '案例不存在');
 *    throw new BizError();                  // 默认 BIZ_ERROR (0, '业务错误')
 *    throw new BizError('参数错误');         // 走默认 0
 *
 * 错误类型表：
 *   BIZ_ERROR       0    通用业务错误（前端习惯用 0 表示失败）
 *   UNAUTHORIZED    401   未登录 / token 失效
 *   FORBIDDEN       403   越权（如非 admin 改他人公司数据）
 *   NOT_FOUND       404   资源不存在
 *   BAD_REQUEST     400   参数错误
 *   CONFLICT        409   资源冲突
 *   INTERNAL        500   业务层内部错误（一般不抛，走到这说明忘了分类）
 */

export const BizCode = {
  BIZ_ERROR: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export type BizCodeValue = (typeof BizCode)[keyof typeof BizCode];

export class BizError extends Error {
  /** 业务错误码；HTTP 层映射到响应 code 字段 */
  public readonly code: BizCodeValue;
  /** 给前端展示的可读消息；缺省值随 code 走 */
  public readonly reason: string;

  constructor(code: BizCodeValue = BizCode.BIZ_ERROR, reason?: string) {
    super(reason ?? defaultReason(code));
    this.name = 'BizError';
    this.code = code;
    this.reason = this.message;
    // 保留原型链（TS extends Error 标配）
    Object.setPrototypeOf(this, BizError.prototype);
  }

  /**
   * 序列化为 wire 形状。HTTP 层在 catch 里直接 return 这个。
   */
  toResponse() {
    return { code: this.code, msg: this.reason };
  }
}

function defaultReason(code: BizCodeValue): string {
  switch (code) {
    case BizCode.BAD_REQUEST:
      return '请求参数错误';
    case BizCode.UNAUTHORIZED:
      return '未授权';
    case BizCode.FORBIDDEN:
      return '无权限';
    case BizCode.NOT_FOUND:
      return '资源不存在';
    case BizCode.CONFLICT:
      return '资源冲突';
    case BizCode.INTERNAL:
      return '服务器内部错误';
    case BizCode.BIZ_ERROR:
    default:
      return '业务错误';
  }
}
