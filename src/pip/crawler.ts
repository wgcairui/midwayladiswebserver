import { Provide, Inject, Pipeline } from "@midwayjs/decorator"
import { IPipelineContext, IPipelineHandler, IValveHandler } from "@midwayjs/core"
import { Crawler } from "../util/crawler"


@Provide()
export class Product implements IValveHandler {

    alias: "product"

    @Inject()
    Crawler: Crawler

    async invoke(ctx: IPipelineContext) {
        return (await this.Crawler.loadUrl(ctx.args.url, { title: ctx.args.title })).products()
    }

}

@Provide()
export class ProductList implements IValveHandler {

    alias: 'productList'

    @Inject()
    Crawler: Crawler

    async invoke(ctx: IPipelineContext) {
        return (await this.Crawler.loadUrl(ctx.args.url)).productList(ctx.args.title)
    }
}

@Provide()
export class PipProducts {

    @Pipeline(['product', 'productList'])
    stages: IPipelineHandler

    async run(url: string, title: string) {
        return this.stages.concatSeries({ args: { url, title } })
    }
}