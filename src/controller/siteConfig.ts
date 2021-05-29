import { Provide, Controller, Inject, Get, Query } from "@midwayjs/decorator"
import { Context } from "@midwayjs/koa"
import { Agent } from "../service/agent"

/**
 * 响应网站配置请求
 */
@Provide()
@Controller("/config")
export class siteConfig {

    @Inject()
    Agent: Agent

    @Inject()
    ctx: Context

    @Get("/agent")
    async agentInfo(@Query() name: string) {
        return this.Agent.getAgent(name)
    }

    @Get("/linkFrend")
    async links() {
        const agents = (await this.Agent.getAgents({ share: true })).map(el => ({ name: el.name, url: el.url }))
        const links = await this.Agent.getLinks()
        return [...agents, ...links]
    }
}