import { Inject, Controller, Provide, Query, Get, Post, Body } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user';
import { ContentCaseNewCache } from "../service/ContentCaseNewCache"
import { Cache } from "../service/cache"
import { Util } from "../util/util"
import { Docments } from "../service/docment"
import { Agent } from "../service/agent"
import { buyList, caseList, cases, support, supportList, product, productList } from '../../types/typeing';

/**
 * 开放接口
 */
@Provide()
@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Inject()
  ContentCaseNewCache: ContentCaseNewCache

  @Inject()
  Cache: Cache

  @Inject()
  Util: Util

  @Inject()
  Docments: Docments

  @Inject()
  Agent: Agent

  /**
   * 根据关键字返回路由链接
   * @param key 关键字
   */
  @Get("/routlinks")
  async getRouts(@Query() key: string) {
    if (!key || typeof key !== 'string' || key.length > 10) return 'args error'
    return await this.ContentCaseNewCache.getRoutLinks(key)
  }

  /**
   * 绑定代理商发送检验短信
   * @param tel 
   * @param id 用户openid
   */
  @Post("/sendValidationSms")
  async sendValidationSms(@Body() tel: string, @Body() id: string) {
    return await this.Util.SendValidation(tel)
      .then(async data => {
        await this.Cache.cache.set(id, data.code, { ttl: null })
        return {
          code: 200,
          data: data.result
        }
      }).catch(e => {
        throw new Error(e)
      })
  }

  /**
   * 绑定代理商检验短信验证码
   * @param code 校验码
   * @param openUser 微信用户信息
   * @param tel 校验手机号
   */
  @Post("/validationSmsCode")
  async validationSmsCode(@Body() code: string, @Body() openUser: Uart.WX.webUserInfo, @Body() tel: string, @Body() company: string) {
    const codes = await this.Cache.cache.get(openUser.openid)
    const agent = (await this.Docments.getAgents(company))[0]
    if (agent && agent.contactTel.some(el => parseInt(el) === parseInt(tel)) && codes && codes === code) {
      this.Cache.cache.del(openUser.openid)
      const result = await this.userService.saveUser({
        name: openUser.nickname,
        user: openUser.openid,
        company: agent.name,
        userId: openUser.unionid,
        avanter: openUser.headimgurl,
        rgtype: "wx",
        userGroup: 'user',
        passwd: openUser.headimgurl,
        tel: Number(tel)
      })
      return {
        code: 200,
        msg: result.id,
        token: await this.Util.Secret_JwtSign(result.toJSON())
      }
    } else {

      return {
        code: 0,
        msg: 'code 已失效或流程出错'
      }
    }
  }

  /**
   * 获取用户信息
   * @param user 
   */
  @Post("/getUserInfo", { middleware: ["tokenParse"] })
  async getUserInfo(@Body() user: Uart.UserInfo) {
    const u = await this.userService.getUser(user.user)
    return {
      code: 200,
      data: {
        name: user.name,
        avanter: u.avanter,
        user: user.user,
        company: user.company
      }
    }
  }

  /**
   * 获取用户目录
   * @param user 
   */
  @Post("/getMenu", { middleware: ["tokenParse"] })
  async getMenu(@Body() user: Uart.UserInfo) {
    const menu = [
      {
        rout: 'admin-news',
        name: '新闻资讯'
      },
      {
        rout: 'admin-case',
        name: '案例管理'
      },
      {
        rout: 'admin-about',
        name: '代理商配置'
      },
      {
        rout: 'admin-picSource',
        name: '素材管理'
      },
      {
        rout: 'admin-buy',
        name: '经销商管理'
      },

      {
        rout: 'admin-link',
        name: '友情链接'
      },
      {
        rout: 'admin-down',
        name: '服务支持'
      },
      {
        rout: 'admin-product',
        name: '产品分类'
      },
      {
        rout: "admin-setting",
        name: "配置"
      }
    ]

    return {
      code: 200,
      data: user.userGroup === 'admin' ? menu : menu.slice(0, 4)
    }
  }

  /**
   * 获取代理商列表
   * @param user 
   * @returns 
   */
  @Post("/getAgents", { middleware: ['tokenParse'] })
  async getAgents(@Body() user: Uart.UserInfo) {
    const data = await this.Agent.getAgents(user.userGroup === 'admin' ? {} : { name: user.company })
    return {
      code: 200,
      data
    }
  }

  /**
   * 获取代理商相关
   * @param user 
   * @param name 
   * @param type 
   */
  @Post("/getAbouts", { middleware: ['tokenParse'] })
  async getAbouts(@Body() user: Uart.UserInfo, @Body() name: string, @Body() type: string) {
    return {
      code: 200,
      data: (await this.Agent.getAbout(name, type))?.content || ''
    }
  }

  /**
   * 设置代理商相关
   * @param name 
   * @param type 
   * @param content 
   * @returns 
   */
  @Post("/setAbouts", { middleware: ['tokenParse'] })
  async setAbouts(@Body() user: Uart.UserInfo, @Body() name: string, @Body() type: string, @Body() content: string) {
    if (name !== user?.company && user.userGroup !== 'admin') {
      return {
        code: 0,
        msg: '非法操作'
      }
    }
    return {
      code: 200,
      data: await this.Agent.setAbout(name, type, content)
    }
  }

  /**
     * 添加修改代理商
     * @param name 名称
     */
  @Post("/addAgent", { middleware: ['tokenParse'] })
  async addAgent(@Body() user: Uart.UserInfo, @Body() name: string, @Body() obj: any) {
    if (name !== user?.company && user.userGroup !== 'admin') {
      return {
        code: 0,
        msg: '非法操作'
      }
    }
    return {
      code: 200,
      data: await this.Agent.addAgent(name, obj)
    }
  }

  /**
     * 获取代理商配置
     * @param name 名称
     */
  @Post("/getAgent")
  async getAgent(@Body() name: string) {
    return {
      code: 200,
      data: await this.Agent.getAgent(name)
    }
  }

  /**
     * 获取新闻列表
     */
  @Post("/getNewsList", { middleware: ['tokenParse'] })
  async getNewsList(@Body() user: Uart.UserInfo, @Body() site?: string) {
    if (site) {
      const list = await this.Docments.getNewsList(site)
      return {
        code: 200,
        data: list.length > 0 ? list : await this.Docments.getNewsList()
      }
    }
    return {
      code: 200,
      data: await this.Docments.getNewsList(user.company)
    }
  }

  /**
   * 获取新闻条目
   * @param title 
   * @returns 
   */
  @Post("/getNews")
  async getNews(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getNews(title)
    }
  }



  /**
     * 获取新闻列表单例
     * @param title 
     * @returns 
     */
  @Post("/getNewsListOne")
  async getNewsListOne(@Body() title: string) {

    return {
      code: 200,
      data: await this.Docments.getNewsListOne(title)
    }
  }

  /**
   * 更新或设置新闻
   * @param news 
   * @param list 
   */
  @Post("/setNews", { middleware: ['tokenParse'] })
  async setNews(@Body() user: Uart.UserInfo, @Body() news: caseList, @Body() list: cases) {
    list.company = user?.company
    news.company = user?.company
    const n = await this.Docments.getNews(news.title)
    if (n && n.company !== user?.company) {
      return {
        code: 0,
        msg: '非法修改'
      }
    }
    await this.Docments.setNewsList(list)
    return {
      code: 200,
      data: await this.Docments.setNews(news)
    }
  }

  /**
   * 删除新闻条目
   * @param title 
   */
  @Post("/delNews", { middleware: ['tokenParse'] })
  async delNews(@Body() user: Uart.UserInfo, @Body() title: string) {
    const n = await this.Docments.getNews(title)
    if (n && n.company !== user?.company) {
      return {
        code: 0,
        msg: '非法修改'
      }
    }
    return {
      code: 200,
      data: await this.Docments.delNews(title)
    }
  }

  /**
    * 获取新闻列表
    */
  @Post("/getCaseList", { middleware: ['tokenParse'] })
  async getCaseList(@Body() user: Uart.UserInfo, @Body() site?: string) {
    if (site) {
      const list = await this.Docments.getCaseList(site)
      return {
        code: 200,
        data: list.length > 0 ? list : await this.Docments.getCaseList()
      }
    }
    return {
      code: 200,
      data: await this.Docments.getCaseList(user.company)
    }
  }

  /**
   * 获取新闻条目
   * @param title 
   * @returns 
   */
  @Post("/getCase")
  async getCase(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getCase(title)
    }
  }



  /**
     * 获取新闻列表单例
     * @param title 
     * @returns 
     */
  @Post("/getCaseListOne")
  async getCaseListOne(@Body() title: string) {

    return {
      code: 200,
      data: await this.Docments.getCaseListOne(title)
    }
  }

  /**
   * 更新或设置新闻
   * @param news 
   * @param list 
   */
  @Post("/setCase", { middleware: ['tokenParse'] })
  async setCase(@Body() user: Uart.UserInfo, @Body() cases: caseList, @Body() list: cases) {
    const n = await this.Docments.getCase(cases.title)
    if (n && n.company !== user?.company) {
      return {
        code: 0,
        msg: '非法修改'
      }
    }
    list.company = user?.company
    cases.company = user?.company
    await this.Docments.setCaseList(list)
    return {
      code: 200,
      data: await this.Docments.setCase(cases)
    }
  }

  /**
   * 删除新闻条目
   * @param title 
   */
  @Post("/delCase", { middleware: ['tokenParse'] })
  async delCase(@Body() user: Uart.UserInfo, @Body() title: string) {
    const n = await this.Docments.getCase(title)
    if (n && n.company !== user?.company) {
      return {
        code: 0,
        msg: '非法修改'
      }
    }
    return {
      code: 200,
      data: await this.Docments.delCase(title)
    }
  }

  /**
     * 获取经销商列表
     * @returns 
     */
  @Post("/getBuys")
  async getBuys() {
    return {
      code: 200,
      data: await this.Docments.getBuys()
    }
  }

  /**
   * 获取指定经销商信息
   */
  @Post("/getBuy")
  async getBuy(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getBuy(title)
    }
  }

  /**
   * 删除指定经销商
   * @param title 
   */
  @Post("/delBuy")
  async delBuy(@Body() title: string) {
    return {
      code: 200,
      data: await this.delBuy(title)
    }
  }

  /**
     * 设置经销商
     * @param buy 
     * @returns 
     */
  async setBuy(@Body() buy: buyList) {
    return {
      code: 200,
      data: await this.Docments.setBuy(buy)
    }
  }

  /**
     * 获取友链
     * @returns 
     */
  @Post("/getLinks")
  async getLinks() {
    return {
      code: 200,
      data: await this.Docments.getLinks()
    }
  }

  /**
   * 设置友链
   * @returns 
   */
  @Post("/setLinks")
  async setLinks(name: string, link: string) {
    return {
      code: 200,
      data: await this.Docments.setLinks(name, link)
    }
  }

  /**
     * 获取所有下载资源
     * @returns 
     */
  @Post("/getSofts")
  async getSofts() {
    return {
      code: 200,
      data: await this.Docments.getSofts()
    }
  }

  /**
   * 获取指定下载资源
   * @returns 
   */
  @Post("/getSoft")
  async getSoft(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getSoft(title)
    }
  }

  /**
   * set指定下载资源
   * @returns 
   */
  @Post("/setSoft")
  async setSoft(@Body() item: support) {
    return {
      code: 200,
      data: await this.Docments.setSoft(item)
    }
  }

  /**
   * 获取指定下载资源
   * @returns 
   */
  @Post("/delSoft")
  async delSoft(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.delSoft(title)
    }
  }

  /**
     * 获取所有链接资源
     * @returns 
     */
  @Post("/getProblems")
  async getProblems() {
    return {
      code: 200,
      data: await this.Docments.getProblems()
    }
  }

  /**
   * 获取指定链接资源
   * @returns 
   */
  @Post("/getProblem")
  async getProblem(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getProblem(title)
    }
  }

  /**
   * set指定链接资源
   * @returns 
   */
  @Post("/setProblem")
  async setProblem(@Body() item: supportList) {
    return {
      code: 200,
      data: await this.Docments.setProblem(item)
    }
  }

  /**
   * delete指定链接资源
   * @returns 
   */
  @Post("/delProblem")
  async delProblem(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.delProblem(title)
    }
  }


  /**
   * 获取产品列表
   * @returns 
   */
  @Post("/getProducts")
  async getProducts() {
    return {
      code: 200,
      data: await this.Docments.getProducts()
    }
  }

  /**
   * 获取产品详情
   * @param title 
   * @returns 
   */
  @Post("/getProduct")
  async getProduct(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.getProduct(title)
    }
  }

  /**
     * set产品详情
     * @param title 
     * @returns 
     */
  @Post("/setProduct")
  async setProduct(@Body() product: product, @Body() list: productList) {
    return {
      code: 200,
      data: await this.Docments.setProduct(product, list)
    }
  }

  /**
   * del产品详情
   * @param title 
   * @returns 
   */
  @Post("/delProduct")
  async delProduct(@Body() title: string) {
    return {
      code: 200,
      data: await this.Docments.delProduct(title)
    }
  }

  /**
     * 更新数据库
     * @param _al 案例页数
     * @param _xw 新闻页数
     * @returns 
     */
  @Post("/updateData")
  async updateData(@Body() al: number, @Body() xw: number) {
    return {
      code: 200,
      data: await this.Docments.updateData(al, xw)
    }
  }

}
