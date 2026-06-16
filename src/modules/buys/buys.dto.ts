/**
 * Buys 模块 DTO（阶段 1.3）
 *
 * 字段与 src/controller/api.ts 老路由入参保持完全一致（兼容契约）。
 *
 * 老路由（无需鉴权）：
 *  - POST /api/getBuys            — 无入参
 *  - POST /api/getBuy             — @Body() title: string
 *  - POST /api/delBuy             — @Body() title: string
 *  - POST /api/setBuy             — @Body() buy: buyList
 *
 * 新路由 1:1 对称，前缀 /api/buys/*。
 */
import { Rule, RuleType } from '@midwayjs/decorator';

/**
 * GET /api/buys/getBuys
 * 老入参：无
 * 新 DTO 兼容：空类（用 @Body(ALL) 时 koa-body 给空对象也能命中）
 */
export class GetBuysDto {
  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;
}

/**
 * GET /api/buys/getBuy
 * 老入参：@Body() title: string
 */
export class GetBuyDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/buys/setBuy
 * 老入参：@Body() buy: buyList
 *
 * buyList 类型（types/typeing.d.ts:119）：
 *   { parentsUntil, link, parent, title, content } + GMpack 字段
 *
 * 用 object().required() 兼容 buyList 的所有可选字段；
 * 前端传什么就存什么，service 层不再做字段裁剪（与老实现一致）。
 */
export class SetBuyDto {
  @Rule(RuleType.object().required())
  buy: any;
}

/**
 * POST /api/buys/delBuy
 * 老入参：@Body() title: string
 */
export class DelBuyDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}