
import { Provide } from "@midwayjs/decorator";
import { getModelForClass } from "@midwayjs/typegoose"
import { AgentConfig } from "../entity/agent";

/**
 * 获取文档信息
 */

@Provide()
export class Docments {

    /**
     * 获取代理商配置
     * @param name 代理商名称,没有默认返回全部
     * @returns 
     */
    async getAgents(name?: string) {
        const model = getModelForClass(AgentConfig)
        return await model.find(name ? { name } : {})
    }
}