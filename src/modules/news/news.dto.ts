/**
 * News 模块 DTO（阶段 1.1）
 *
 * 字段与 src/controller/api.ts 老路由入参保持完全一致（兼容契约）。
 * 入参用 @Rule / @RuleType（joi 风格）走 class-validator 校验。
 *
 * 注意：koa-body 默认是 application/json + form，老接口里 @Body() / @Body(ALL) 两种
 * 都有；这里统一用 @Body(ALL) + DTO 校验（midway 2 推荐写法）。
 *
 * 字段级 filter / sort 校验：
 *  - field 是否合法 → service 层 parseFilter/parseSort 强校验（白名单）
 *  - op / dir 字面值 → joi `.valid()` 兜底（防止 typo 提前报错）
 *  - value 类型 → service 层 parseFilter 强校验（in 要 array / contains 要 string）
 *
 * 注意：news/case 的 list 路由挂 tokenParse，不挂 @Validate()（PR #10 教训）。
 * 所以 DTO 上 @Rule 仅用于 TS 类型契约；运行时过滤靠 service 层兜底。
 */
import { Rule, RuleType } from '@midwayjs/decorator';
import { FilterClause, SortClause } from '../../util/filter';

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

  /**
   * 多维度过滤（数组）。
   * 字段白名单见 NewsService.searchableFields；
   * 运行时在 service 层 parseFilter 拒绝非法 field / op / value。
   */
  @Rule(
    RuleType.array()
      .items(
        RuleType.object({
          field: RuleType.string().required(),
          op: RuleType.string()
            .valid('eq', 'in', 'contains', 'gte', 'lte')
            .required(),
          value: RuleType.any(),
        })
      )
      .optional()
  )
  filter?: FilterClause[];

  /**
   * 多维度排序（数组，按顺序应用）。
   * 字段白名单见 NewsService.sortableFields；
   * 运行时在 service 层 parseSort 拒绝非法 field / dir。
   */
  @Rule(
    RuleType.array()
      .items(
        RuleType.object({
          field: RuleType.string().required(),
          dir: RuleType.string().valid('asc', 'desc').required(),
        })
      )
      .optional()
  )
  sort?: SortClause[];
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
