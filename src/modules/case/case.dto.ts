/**
 * Case 模块 DTO（阶段 1.1）
 *
 * 与 src/controller/api.ts 老路由入参保持完全一致。
 */
import { Rule, RuleType } from '@midwayjs/decorator';

export class GetCaseListDto {
  @Rule(RuleType.string().optional().allow(''))
  site?: string;
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
