/**
 * Links 模块 DTO（阶段 1.3）
 *
 * 与 src/controller/api.ts 老路由入参保持完全一致。
 */
import { Rule, RuleType } from '@midwayjs/decorator';

export class GetLinksDto {
  @Rule(RuleType.number().optional().min(1))
  page?: number;

  @Rule(RuleType.number().optional().min(1).max(100))
  pageSize?: number;
}

export class SetLinksDto {
  @Rule(RuleType.string().required().min(1))
  name: string;

  @Rule(RuleType.string().required().min(1))
  link: string;
}
