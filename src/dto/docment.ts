import { Rule, RuleType } from "@midwayjs/decorator"

/**
 * 校验统一查询参数
 */
export class Arg {
    @Rule(RuleType.string().required())
    id: string
}

/**
 * 校验产品查询
 */
export class SeachProducts {
    @Rule(RuleType.string().max(100))
    seach: string

    getS() {
        return ''
    }
}

/**
 * 上下文
 */
export class GetContent {
    @Rule(RuleType.string().pattern(/(case|news)/))
    link: string

    getType() {
        return this.link.split("/")[1]
    }
}