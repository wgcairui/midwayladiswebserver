/**
 * Support 模块 DTO（阶段 1.3）
 *
 * softs (技术支持) + problems (常见问题) 共用 Support / Support_list entity，
 * 共享 dto 命名。字段与 src/controller/api.ts 老路由入参保持完全一致。
 */
import { Rule, RuleType } from '@midwayjs/decorator';

/**
 * POST /api/support/getSofts
 * 老入参：无 body
 * 新 DTO 兼容：保留空 dto 以便后续扩展
 */
export class GetSoftsDto {
  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;
}

/**
 * POST /api/support/getSoft
 * 老入参：@Body() title: string
 */
export class GetSoftDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/support/setSoft
 * 老入参：@Body() item: support（任意对象，title 必填）
 */
export class SetSoftDto {
  @Rule(RuleType.object().required())
  item: any;
}

/**
 * POST /api/support/delSoft
 * 老入参：@Body() title: string
 */
export class DelSoftDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/support/getProblems
 * 老入参：无 body
 */
export class GetProblemsDto {
  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;
}

/**
 * POST /api/support/getProblem
 * 老入参：@Body() title: string
 */
export class GetProblemDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}

/**
 * POST /api/support/setProblem
 * 老入参：@Body() item: supportList（任意对象，title 必填）
 */
export class SetProblemDto {
  @Rule(RuleType.object().required())
  item: any;
}

/**
 * POST /api/support/delProblem
 * 老入参：@Body() title: string
 */
export class DelProblemDto {
  @Rule(RuleType.string().required().min(1))
  title: string;
}
