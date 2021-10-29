import { Rule, RuleType } from '@midwayjs/decorator';

/**
 * 校验微信登录
 */
export class Rwxlogin {
  @Rule(RuleType.string())
  code: string;

  @Rule(
    RuleType.string().equal(
      'e0bwU6jnO2KfIuTgBQNDVxlsy7iGtoF3A8rWpSCM5RzZ1dmYJcLHqPhXav4Ek9lIC6P4cULfktXj5Wcwa3GcCBCYRMWidUzZyJyTqu'
    )
  )
  state: string;
}
