import { Init, Provide } from "@midwayjs/decorator";
import { getModelForClass, ReturnModelType, types } from "@typegoose/typegoose"
import { LinkFrend, AgentConfig } from "../entity/agent"

/**
 * 代理商相关操作
 */
@Provide()
export class Agent {
    linkModel: ReturnModelType<typeof LinkFrend, types.BeAnObject>
    configModel: ReturnModelType<typeof AgentConfig, types.BeAnObject>
    @Init()
    async init() {
        this.linkModel = getModelForClass(LinkFrend, { schemaOptions: { timestamps: true, collection:"linkfrends"} })
        this.configModel = getModelForClass(AgentConfig, { schemaOptions: { timestamps: true } })
    }

    /**
     * 获取指定代理商配置信息
     * @param name 代理商名称
     * @returns 
     */
    async getAgent(name: string) {
        return this.configModel.findOne({ name })
    }

    /**
     * 获取代理商信息
     * @param filter 刷选条件
     * @returns 
     */
    async getAgents(filter: Partial<AgentConfig> = {}) {
        return this.configModel.find(filter)
    }

    /**
     * 获取所有友情链接
     * @returns 
     */
    async getLinks() {
        return this.linkModel.find()
    }

}