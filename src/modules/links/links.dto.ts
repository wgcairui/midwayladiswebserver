/**
 * Links 模块 DTO（阶段 1.3）
 *
 * 与 src/controller/api.ts 老路由入参保持完全一致。
 *
 * filter / sort 字段：
 *  - 字面值校验由 joi 兜底（op / dir 字面值）
 *  - field 合法性由 service 层 parseFilter/parseSort 强校验（白名单）
 *
 * links 公开接口，无 tokenParse。
 */
import { Rule, RuleType } from '@midwayjs/decorator';
import { FilterClause, SortClause } from '../../util/filter';

export class GetLinksDto {
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

export class SetLinksDto {
  @Rule(RuleType.string().required().min(1))
  name: string;

  @Rule(RuleType.string().required().min(1))
  link: string;
}
