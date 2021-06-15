import { Aspect, IMethodAspect, JoinPoint, Provide } from "@midwayjs/decorator";
import { Context } from "@midwayjs/koa";
import { FileOprate } from "../controller/file"

/**
 * 拦截file文件请求,检查链接,把链接转换为可读的格式
 */
@Provide()
@Aspect(FileOprate, "file")
export class codeConver implements IMethodAspect {
    async before(point: JoinPoint) {
        const ctx = point.target.ctx as Context
        ctx.originalUrl = decodeURI(ctx.req.url)
    }
}

