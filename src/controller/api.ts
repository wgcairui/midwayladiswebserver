import { Inject, Controller, Provide, Query, Get } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user';
import { ContentCaseNewCache } from "../service/ContentCaseNewCache"

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

  @Get('/get_user')
  async getUser(@Query() uid) {
    /* const user = await this.userService.getUser({ uid }); */
    return { success: true, message: 'OK', };
  }

  /**
   * 根据关键字返回路由链接
   * @param key 关键字
   */
  @Get("/routlinks")
  async getRouts(@Query() key: string) {
    if (!key || typeof key !== 'string' || key.length > 10) return 'args error'
    return await this.ContentCaseNewCache.getRoutLinks(key)
  }
}
