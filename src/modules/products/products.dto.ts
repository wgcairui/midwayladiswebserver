/**
 * Products 模块 DTO（阶段 1.3）
 *
 * 字段与 src/controller/api.ts 老路由入参保持完全一致（兼容契约）。
 *
 * 老路由（无需鉴权 — 老前端是公开调用）：
 *  - POST /api/getProducts       — 无入参
 *  - POST /api/getProduct        — @Body() title: string
 *  - POST /api/setProduct        — @Body() product: product, @Body() list: productList  (双入参)
 *  - POST /api/delProduct        — @Body() title: string
 *
 * 新路由 1:1 对称，前缀 /api/products/*。
 *
 * 与 buys / softs 的关键区别：setProduct 是双入参（product + list），
 * 两个 entity 都要写入，老实现就是这个签名。
 *
 * filter / sort 字段：
 *  - 字面值校验由 joi 兜底（op / dir 字面值）
 *  - field 合法性由 service 层 parseFilter/parseSort 强校验（白名单）
 *
 * products 公开接口，可挂 @Validate()（joi 会跑）。
 */
import { Rule, RuleType } from '@midwayjs/decorator';
import { FilterClause, SortClause } from '../../util/filter';

/**
 * POST /api/products/getProducts
 * 老入参：无
 * 新 DTO 兼容：空类（用 @Body(ALL) 时 koa-body 给空对象也能命中）
 */
export class GetProductsDto {
  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;

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
 * POST /api/products/getProduct
 * 老入参：@Body() title: string
 */
export class GetProductDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/products/setProduct
 * 老入参：@Body() product: product, @Body() list: productList
 *
 * 双入参：两个 entity 都写，老实现就是这样。
 * product / list 类型（types/typeing.d.ts:52-79）字段都是 optional / required 混合，
 * 用 object().required() 兼容，前端传什么就存什么，service 层不再做字段裁剪。
 */
export class SetProductDto {
  @Rule(RuleType.object().required())
  product: any;

  @Rule(RuleType.object().required())
  list: any;
}

/**
 * POST /api/products/delProduct
 * 老入参：@Body() title: string
 */
export class DelProductDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}