import { Provide, Inject, Controller, Post, ALL, Body, Validate } from "@midwayjs/decorator"
import { Context } from "@midwayjs/koa"
import { UserInfo } from "../../types/typeing"
import { UserService } from "../service/user"
import { Util } from "../util/util"
import { Rwxlogin } from "../dto/auth"
import { WxOpen } from "../service/wxOpen"
import { Docments } from "../service/docment"

/**
 * 响应用户登录登出等操作
 */
@Provide()
@Controller("/auth")
export class AuthController {
    @Inject()
    ctx: Context

    @Inject()
    UserService: UserService

    @Inject()
    Util: Util

    @Inject()
    WxOpen: WxOpen

    @Inject()
    Docments: Docments

    /**
     * 用户登录
     * @param user 
     * @returns 
     */
    @Post("/login")
    async userLogin(@Body(ALL) user: UserInfo) {
        const result = await this.UserService.getUser(user.user)

        if (!result) {
            throw new Error("用户未注册");
        }
        if (result.passwd === this.Util.Crypto_Encrypto(user.passwd)) {
            result.passwd = ""
            const token = await this.Util.Secret_JwtSign(result.toJSON())
            return { token, user };
        } else {
            throw new Error("密码错误，请核对密码");
        }
    }

    /**
     * 获取用户名
     * @returns 
     */
    @Post("/user", { middleware: ['tokenParse'] })
    async user(@Body() user: Uart.UserInfo) {
        return { user: user.name }
    }

    /**
     * 登出
     * @returns 
     */
    @Post("/logout")
    async logout() {
        return { stat: true, msg: "success" }
    }


    /**
     * 微信登录
     * @param data 
     */
    @Post("/wxlogin")
    @Validate()
    async wxlogin(@Body(ALL) data: Rwxlogin) {
        if (!data.code) throw new Error("code error")
        const openUser = await this.WxOpen.userInfo(data.code).catch(e => console.log(e))
        if (!openUser) throw new Error("login error")
        const user = await this.UserService.getUser(openUser.openid)
        if (user) {
            const token = await this.Util.Secret_JwtSign(user.toJSON())
            return { code: 200, token, user: user };
        } else {
            //  如果没有用户则返回
            const agents = await this.Docments.getAgents()
            return {
                code: 2,
                openUser,
                content: agents.map(el => ({
                    name: el.name,
                    tels: el.contactTel
                        .map(tel => {
                            if (tel[0] === '1') {
                                return parseInt(tel)
                            } else {
                                return 1 + tel.split("1")[1]
                            }
                        })
                        .filter(tel => /^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/.test(tel.toString()))
                }))
            }
        }
    }

}