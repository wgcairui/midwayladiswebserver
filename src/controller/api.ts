import { Inject, Controller, Provide, Query, Get, Post, Body } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user';
import { ContentCaseNewCache } from "../service/ContentCaseNewCache"
import { Cache } from "../service/cache"
import { Util } from "../util/util"
import { Docments } from "../service/docment"

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
      .then(data => {
        console.log(data);

        this.Cache.set(id + tel, data.code, { ttl: 120 })
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
    const codes = await this.Cache.get(openUser.openid + tel)

    const agent = (await this.Docments.getAgents(company))[0]
    if (agent && agent.contactTel.some(el => parseInt(el) === parseInt(tel)) && codes && codes === code) {
      const result = await this.userService.saveUser({
        name: openUser.nickname,
        user: openUser.openid,
        company: agent.name,
        userId: openUser.unionid,
        avanter: openUser.headimgurl,
        rgtype: "wx",
        userGroup: 'user',
        passwd: openUser.headimgurl
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
}
