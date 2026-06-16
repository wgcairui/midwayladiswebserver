/**
 * News 模块 DTO（阶段 1.1）
 *
 * 字段与 src/controller/api.ts 老路由入参保持完全一致（兼容契约）。
 * 入参用 @Rule / @RuleType（joi 风格）走 class-validator 校验。
 *
 * 注意：koa-body 默认是 application/json + form，老接口里 @Body() / @Body(ALL) 两种
 * 都有；这里统一用 @Body(ALL) + DTO 校验（midway 2 推荐写法）。
 */
import { Rule, RuleType } from '@midwayjs/decorator';

/**
 * GET /api/news/getNewsList
 * 老入参：@Body() user: Uart.UserInfo, @Body() site?: string
 * 新 DTO 兼容：user 从 tokenParse 中间件注入，site 单独字段
 */
export class GetNewsListDto {
  @Rule(RuleType.string().optional().allow(''))
  site?: string;

  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;
}

/**
 * GET /api/news/getNews
 * 老入参：@Body() title: string
 */
export class GetNewsDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * GET /api/news/getNewsListOne（与 getNews 几乎一样，单独 DTO 方便以后扩展）
 * 老入参：@Body() title: string
 */
export class GetNewsListOneDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/news/setNews
 * 老入参：@Body() user, @Body() news: caseList, @Body() list: cases
 * news / list 由 user 鉴权（tokenParse 注入），不需要在 DTO 里验
 */
export class SetNewsDto {
  // 注：业务层会在 controller 内补 company 字段，不需要前端传
  @Rule(RuleType.object().required())
  news: any;

  @Rule(RuleType.object().required())
  list: any;
}

/**
 * POST /api/news/delNews
 * 老入参：@Body() user, @Body() title: string
 */
export class DelNewsDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}
