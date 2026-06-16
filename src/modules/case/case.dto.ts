/**
 * Case 模块 DTO（阶段 1.1）
 *
 * 与 src/controller/api.ts 老路由入参保持完全一致。
 *
 * filter / sort 字段：
 *  - 字面值校验由 joi 兜底（op ∈ 5 种 / dir ∈ asc|desc）
 *  - field 合法性由 service 层 parseFilter/parseSort 强校验（白名单）
 *
 * case list 路由挂 tokenParse，不挂 @Validate()（PR #10 教训）。
 */
import { Rule, RuleType } from '@midwayjs/decorator';
import { FilterClause, SortClause } from '../../util/filter';

export class GetCaseListDto {
  @Rule(RuleType.string().optional().allow(''))
  site?: string;

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

export class GetCaseDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

export class GetCaseListOneDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

export class SetCaseDto {
  @Rule(RuleType.object().required())
  cases: any;

  @Rule(RuleType.object().required())
  list: any;
}

export class DelCaseDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}
