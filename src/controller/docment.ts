import { ALL, Body, Controller, Inject, Post, Provide, Validate } from "@midwayjs/decorator";
import { Context } from "@midwayjs/koa";
import { ContentCaseNewCache } from "../service/ContentCaseNewCache";
import { GetContent, SeachProducts } from "../dto/docment"

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
    @Validate()
    async getContent(@Body(ALL) link: GetContent) {
        return await this.ContentCaseNewCache.GetContentCtx(link.getType(), link.link)
    }

    /**
     * 搜索产品信息
     */
    @Post("/seachProducts")
    @Validate()
    async seachProducts(@Body(ALL) seach: SeachProducts) {
        return await this.ContentCaseNewCache.seachProducts(seach.seach)
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