import { Provide, Inject, Controller, Post, ALL, Body } from "@midwayjs/decorator"
import { Context } from "@midwayjs/koa"
import { UserInfo } from "../../types/typeing"
import { UserService } from "../service/user"
import { CryptoSecret } from "../service/util"

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
    CryptoSecret: CryptoSecret

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
        if (!result.stat) {
            throw new Error("账户未启用，请联系管理员启用");
        }
        if (result.passwd === this.CryptoSecret.Crypto_Encrypto(user.passwd)) {
            result.passwd = ""
            const token = await this.CryptoSecret.Secret_JwtSign(result)
            return { token, user };
        } else {
            throw new Error("密码错误，请核对密码");
        }
    }

    /**
     * 获取用户名
     * @returns 
     */
    @Post("/user")
    async user() {
        const token = this.ctx.cookies.get("token")
        const tokenSlice = <string>token.split(" ")[1].trim()
        const { user } = await this.CryptoSecret.Secret_JwtVerify<UserInfo>(tokenSlice)
        return { user }
    }

    /**
     * 登出
     * @returns 
     */
    @Post("/logout")
    async logout() {
        return { stat: true, msg: "success" }
    }

}