/**
 * 微信开放平台实例
 *
 */

import { Init, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { wxOpen } from '@cairui/wx-sdk';
import { secret_wxOpen } from '../key/key';

@Provide()
@Scope(ScopeEnum.Singleton)
export class WxOpen {
  App: wxOpen;

  @Init()
  async init() {
    this.App = new wxOpen(secret_wxOpen.appid, secret_wxOpen.secret);
  }

  /**
   * 根据用code字符串,获取用户信息
   * @param code
   * @returns
   */
  userInfo(code: string) {
    return this.App.userInfo(code);
  }
}
