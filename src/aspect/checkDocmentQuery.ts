/**
 * 拦截网站对文档的查询,没有携带name头文件的请求将被抛弃
 */

import { Aspect, IMethodAspect, JoinPoint, Provide } from "@midwayjs/decorator";
import { Docment } from "../controller/docment"
// import { siteConfig } from "../controller/siteConfig"
@Provide()
@Aspect(Docment)
export class checkDocmentQuery implements IMethodAspect {
    async before(point: JoinPoint) {
        const name = point.target.ctx.request.header.name
        if (!name) return ''
    }
}