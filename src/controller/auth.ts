import {
  Provide,
  Inject,
  Controller,
  Post,
  ALL,
  Body,
  Validate,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { UserInfo } from '../../types/typeing';
import { UserService } from '../service/user';
import { Util } from '../util/util';
import { Rwxlogin } from '../dto/auth';
import { WxOpen } from '../service/wxOpen';
import { Docments } from '../service/docment';
import { isPhoneNumber } from 'class-validator';

/**
 * 响应用户登录登出等操作
 */
@Provide()
@Controller('/auth')
export class AuthController {
  @Inject()
  ctx: Context;

  @Inject()
  UserService: UserService;

  @Inject()
  Util: Util;

  @Inject()
  WxOpen: WxOpen;

  @Inject()
  Docments: Docments;

  /**
   * 用户登录
   * @param user
   * @returns
   */
  @Post('/login')
  async userLogin(@Body(ALL) user: UserInfo) {
    const result = await this.UserService.getUser(user.user);

    if (!result) {
      throw new Error('用户未注册');
    }
    if (result.passwd === this.Util.Crypto_Encrypto(user.passwd)) {
      result.passwd = '';
      const token = await this.Util.Secret_JwtSign(result.toJSON());
      return { token, user };
    } else {
      throw new Error('密码错误，请核对密码');
    }
  }

  /**
   * 获取用户名
   * @returns
   */
  @Post('/user', { middleware: ['tokenParse'] })
  async user(@Body() user: Uart.UserInfo) {
    return { user: user.name };
  }

  /**
   * 登出
   * @returns
   */
  @Post('/logout')
  async logout() {
    return { stat: true, msg: 'success' };
  }

  /**
   * 更新当前用户资料
   * Body: { name?, avanter?, company?, userGroup? }
   */
  @Post('/updateProfile', { middleware: ['tokenParse'] })
  async updateProfile(@Body(ALL) body: { name?: string; avanter?: string; company?: string; userGroup?: string; user?: Uart.UserInfo }) {
    const me = (body as any).user as Uart.UserInfo
    const patch: any = { ...body }
    delete patch.user
    const u = await this.UserService.updateProfile(me, patch)
    if (!u) throw new Error('用户不存在')
    u.passwd = ''
    return { code: 200, data: u.toJSON() }
  }

  /**
   * 修改当前用户密码
   * Body: { oldPass, newPass }
   */
  @Post('/changePassword', { middleware: ['tokenParse'] })
  async changePassword(@Body(ALL) body: { oldPass: string; newPass: string; user?: Uart.UserInfo }) {
    if (!body || !body.oldPass || !body.newPass) {
      throw new Error('参数不完整')
    }
    await this.UserService.changePassword(body.user!, body.oldPass, body.newPass)
    return { code: 200, msg: '密码修改成功' }
  }

  /**
   * 微信登录
   * @param data
   */
  @Post('/wxlogin')
  @Validate()
  async wxlogin(@Body(ALL) data: Rwxlogin) {
    if (!data.code) throw new Error('code error');
    const openUser = await this.WxOpen.userInfo(data.code).catch(e =>
      console.log(e)
    );
    if (!openUser) throw new Error('login error');
    const user = await this.UserService.getUser(openUser.openid);
    
    if (user) {
      const token = await this.Util.Secret_JwtSign(user.toJSON());
      return { code: 200, token, user: user };
    } else {
      //  如果没有用户则返回
      const agents = await this.Docments.getAgents();
      return {
        code: 2,
        openUser,
        agents,
        content: agents.map(el => ({
          name: el.name,
          tels: (el.contactTel || [])
            .map(tel => {
              if (tel[0] === '1') {
                return parseInt(tel);
              } else {
                return 1 + tel.split('1')[1];
              }
            })
            .filter(tel => isPhoneNumber(String(tel),'CN')
            ),
        })),
      };
    }
  }
}
