import { Aspect, IMethodAspect, JoinPoint, Provide } from "@midwayjs/decorator";
import { Context } from "@midwayjs/koa";
import { APIController } from "../controller/api"

/**
 * 拦截返回值
 */
@Provide()
@Aspect(APIController)
export class ApiAspect implements IMethodAspect {
    async afterReturn(point: JoinPoint, result: any) {
        const method = point.methodName
        const ctx = point.target.ctx as Context


        if (/(^set|^del|^update)/ig.test(method)) {
            console.log({ method, ctx: ctx.request.body, result });
        }

    }
}
