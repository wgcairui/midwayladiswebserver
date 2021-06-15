import { Init, Provide } from "@midwayjs/decorator";
import { getModelForClass, ReturnModelType, types } from "@typegoose/typegoose"
import { LinkFrend, AgentConfig } from "../entity/agent"
import { About } from "../entity/docment";

/**
 * 代理商相关操作
 */
@Provide()
export class Agent {
    linkModel: ReturnModelType<typeof LinkFrend, types.BeAnObject>
    configModel: ReturnModelType<typeof AgentConfig, types.BeAnObject>
    aboutModel: ReturnModelType<typeof About, types.BeAnObject>;
    @Init()
    async init() {
        this.linkModel = getModelForClass(LinkFrend, { schemaOptions: { timestamps: true, collection: "linkfrends" } })
        this.configModel = getModelForClass(AgentConfig, { schemaOptions: { timestamps: true } })
        this.aboutModel = getModelForClass(About, { schemaOptions: { timestamps: true } })
    }

    /**
     * 获取指定代理商配置信息
     * @param name 代理商名称
     * @returns 
     */
    async getAgent(name: string) {
        return this.configModel.findOne({ name }).lean()
    }

    /**
     * 获取代理商信息
     * @param filter 刷选条件
     * @returns 
     */
    async getAgents(filter: Partial<AgentConfig> = {}) {
        return this.configModel.find(filter).lean()
    }

    /**
     * 获取所有友情链接
     * @returns 
     */
    async getLinks() {
        return this.linkModel.find().lean()
    }

    /**
     * 获取代理商相关信息
     * @param name 代理商名称
     * @param type 类型
     * @returns 
     */
    async getAbout(name: string, type: string) {
        return this.aboutModel.findOne({ webSite: name, type }).lean()
    }

    /**
     * 设置代理商相关信息
     * @param name 代理商名称
     * @param type 类型
     * @returns 
     */
    async setAbout(name: string, type: string, content: string) {
        return this.aboutModel.updateOne({ webSite: name, type }, { $set: { content } }, { upsert: true }).lean()
    }

    /**
     * 添加修改代理商
     * @param name 名称
     * @param url 网址
     */
    addAgent(name: string, obj: any) {
        return this.configModel.updateOne({ name }, { $set: { ...obj } }, { upsert: true }).lean()
    }

}