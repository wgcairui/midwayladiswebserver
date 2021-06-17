import { Provide } from "@midwayjs/decorator"
import { Context, IMidwayKoaNext, IWebMiddleware } from "@midwayjs/koa";
import { Docments } from "../service/docment"

/**
 * 代理商网站使用,如果没有代理商网站,报错
 */
@Provide()
export class MiddlewareSitename implements IWebMiddleware {
    resolve() {
        return async (ctx: Context, next: IMidwayKoaNext) => {
            const site = ctx.request.header.name as string
            if (!site || (await (await ctx.requestContext.getAsync<Docments>("docments")).getAgents(decodeURI(site))).length < 1) {
                return {
                    code: 0,
                    err: new Error("permissions Error")
                }
            } else {
                ctx.query.site = decodeURI(site)
            }
            await next()
        }
    }
}