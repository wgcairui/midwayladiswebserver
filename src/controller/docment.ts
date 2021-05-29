import { Body, Controller, Inject, Post, Provide } from "@midwayjs/decorator";
import { Context } from "@midwayjs/koa";
import { ContentCaseNewCache } from "../service/ContentCaseNewCache";

/**
 *  响应文档查询请求
 */
@Provide()
@Controller("/docment")
export class Docment {
    @Inject()
    ctx: Context

    @Inject()
    ContentCaseNewCache: ContentCaseNewCache


    /**
     * 获取案例或新闻上下文
     * @param link 
     */
    @Post("/GetContent")
    async GetContent(@Body() link: string) {
        const type = link.split("/")[1];
        if (type === 'case' || type === 'news') {
            return await this.ContentCaseNewCache.GetContentCtx(type, link)
        } else throw new Error('不支持的操作')
    }

    /**
     * 搜索产品信息
     */
    @Post("/seachProducts")
    async seachProducts(@Body() seach: string) {
        if (typeof seach === 'string' && seach.length < 100) {
            return await this.ContentCaseNewCache.seachProducts(seach)
        } else throw new Error('查询字符出错')
    }

    /**
     * 获取网站其它内容
     * @returns 
     */
    @Post("/Get_arg")
    async Get_arg() {
        return await this.ContentCaseNewCache.getDoment()
    }
}