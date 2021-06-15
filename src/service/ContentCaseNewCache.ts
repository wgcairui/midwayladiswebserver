import { Init, Inject, Provide } from "@midwayjs/decorator";
import { Context } from "@midwayjs/koa";
import { getModelForClass } from "@typegoose/typegoose";
import { Types } from "mongoose"
import { About, Page, Product, Product_list, Support, Support_list, Buy, Buy_list, VR, Case, Case_list, Router, New, News_list } from "../entity/docment"
import { Cache } from "./cache"

type DbTables =
    | "Product"
    | "Product_list"
    | "Support"
    | "Support_list"
    | "Buy_list"
    | "Buy"
    | "VR"
    | "Case"
    | "Case_list"
    | "News"
    | "News_list"
    | "About"
    | "Page"
    | "Router";

interface query {
    link?: string,
    SiteName?: string,
    i18n: "en" | "zh"
    table: DbTables;
    title?: string;
    parent?: string;
    isNews?: boolean;
    queryKeys?: string[]
    type: string
}

type Dbclass = typeof About | typeof Page | typeof Product | typeof Product_list | typeof Support | typeof Support_list | typeof Buy | typeof Buy_list | typeof VR | typeof Case | typeof Case_list | typeof Router

interface dbs {
    [x: string]: Dbclass;
};

interface caseCtx {
    pre: any,
    next: any
}
/**
 * 获取ladis网站内容
 */
@Provide()
export class ContentCaseNewCache {
    @Inject()
    cache: Cache

    @Inject()
    ctx: Context

    dbs: dbs;

    @Init()
    async init() {
        this.dbs = {
            "About": About,
            "Buy": Buy,
            "Buy_list": Buy_list,
            "Case": Case,
            "Case_list": Case_list,
            "News": New,
            "News_list": News_list,
            "Page": Page,
            "Product": Product,
            "Product_list": Product_list,
            "Router": Router,
            "Support": Support,
            "Support_list": Support_list,
            "VR": VR
        }
    }


    async getRoutLinks(key: string) {
        const model = getModelForClass(Router)
        return await model.find({ title: { $regex: key } })
    }

    /**
     * 获取新闻和案例文档的上下文链接
     * @param type 文档类型
     * @param link 文档链接
     */
    async GetContentCtx(type: string, link: string) {
        const { en } = this.getarg()

        const collection = `${en ? 'en' : ''}${type.toLocaleLowerCase()}${/s$/.test(type) ? '' : 's'}`
        const model = getModelForClass(Case, { schemaOptions: { collection } })
        const doc = await model.findOne({ link }, { _id: 1 }).lean()
        if (!doc) return null
        let cacheData = await this.cache.get<caseCtx>(type + doc._id)
        if (!cacheData) {
            const docs = await model.find({}, { link: 1 }).lean()
            for (let i = 0; i < docs.length; i++) {
                const ctx: caseCtx = {
                    pre: docs[i - 1]?._id || docs[i]._id,
                    next: docs[i + 1]?._id || docs[i]._id
                }
                await this.cache.set(type + docs[i]._id, ctx, { ttl: 60 * 60 })
            }
            cacheData = await this.cache.get(type + doc._id)
        }
        const ids = [Types.ObjectId(cacheData.pre), Types.ObjectId(cacheData.next)]
        const m = await model.find({ _id: { $in: ids } }, { link: 1, text: 1 })
        return {
            pre: m[0],
            next: m[1]
        }
    }

    /**
     * 查询产品信息
     * @param str 通配符
     * @returns 
     */
    async seachProducts(str: string) {
        const regstr = eval('/' + str + '/i')
        const model = getModelForClass(Product)
        return await model.find({ "$or": [{ "Pagekeywords": regstr }, { "title": regstr }] }).lean()
    }

    /**
     * 获取网站其它内容
     * @returns 
     */
    async getDoment() {
        const { en, table, isNews, SiteName, query } = this.getarg()

        if (!table) throw new Error('argment table require')
        const collection = `${en ? 'en' : ''}${table.toLocaleLowerCase()}${/s$/.test(table) ? '' : 's'}`
        // console.log({ collection, en, table, isNews, SiteName, query });

        if (table === 'News' || table === "Case") {
            const model = table === 'Case' ? getModelForClass(Case) : getModelForClass(New)
            if (isNews) {
                const list = await model.find({ company: SiteName }).sort({ "data.time": -1 }).lean()
                if (list.length === 0) return await model.find().sort({ "data.time": -1 }).lean()
                else return list
            } else {
                const list = await model.find({ company: SiteName, ...query }).sort({ "data.time": -1 }).lean()
                if (list.length === 0) {
                    if ((await model.find({ company: SiteName })).length === 0) {
                        return await model.find(query).sort({ "data.time": -1 }).lean()
                    } else {
                        return await model.find({ company: SiteName })
                    }

                }
                else {
                    return list
                }
            }


        }
        if (table === 'About') {
            const model = getModelForClass(About)
            return await model.find({ webSite: SiteName }).lean()
        }
        const model = getModelForClass(this.dbs[table], { schemaOptions: { collection } })
        return await model.find(query).lean()
    }

    private getarg() {
        const body = this.ctx.request.body as unknown as query
        const SiteName = decodeURI(this.ctx.header.name as string)
        const queryKeySet = body?.queryKeys ? new Set(body.queryKeys) : new Set()
        const queryArr = Object.entries(body).filter(([key]) => queryKeySet.has(key)).map(el => ({ [el[0]]: el[1] }))
        const query = Object.assign({}, ...queryArr)
        return {
            link: body?.link || '',
            SiteName,
            en: body?.i18n === 'en',
            table: body?.table || '',
            title: body?.title || '',
            isNews: body?.isNews || false,
            type: body?.type || '',
            query
        }
    }
}