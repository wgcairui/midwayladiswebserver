/**
 * NewsController（阶段 1.1）
 *
 * 新路由前缀：/api/news/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getNews* /api/setNews /api/delNews
 *
 * 行为 / 入参 / 返参 shape 100% 保持兼容：
 *  - 成功：{ code: 200, data: ... }
 *  - 失败：{ code: 0, msg: 'xxx' }（保留老前端习惯）
 *
 * 权限规则（与老路由完全一致）：
 *  - setNews / delNews 必须有 tokenParse（中间件挂在路由上）；
 *  - setNews 校验：已有 news 的 company !== user.company && user.userGroup !== 'admin' → 拒绝；
 *  - setNews 写入前会强制把 news.company / list.company 改为 user.company（防越权篡改公司字段）。
 */
import {
  ALL,
  Body,
  Controller,
  Inject,
  Post,
  Provide,
  Validate,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { NewsService } from './news.service';
import { fail, ok } from '../../util/response';
import {
  DelNewsDto,
  GetNewsDto,
  GetNewsListDto,
  GetNewsListOneDto,
  SetNewsDto,
} from './news.dto';

@Provide()
@Controller('/api/news')
export class NewsController {
  @Inject()
  ctx: Context;

  @Inject()
  newsService: NewsService;

  /**
   * 获取新闻列表
   * 老入参：@Body() user, @Body() site? —— site 优先 + fallback
   */
  @Post('/getNewsList', { middleware: ['tokenParse'] })
  @Validate()
  async getNewsList(@Body(ALL) dto: GetNewsListDto) {
    // tokenParse 中间件会把 user 注入到 ctx.request.body.user
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const site = dto?.site;
    if (site) {
      const list = await this.newsService.getNewsList(site);
      return ok(list.length > 0 ? list : await this.newsService.getNewsList());
    }
    return ok(await this.newsService.getNewsList(user?.company));
  }

  /**
   * 获取新闻详情
   */
  @Post('/getNews')
  @Validate()
  async getNews(@Body(ALL) dto: GetNewsDto) {
    return ok(await this.newsService.getNews(dto.title));
  }

  /**
   * 获取新闻列表单例
   */
  @Post('/getNewsListOne')
  @Validate()
  async getNewsListOne(@Body(ALL) dto: GetNewsListOneDto) {
    return ok(await this.newsService.getNewsListOne(dto.title));
  }

  /**
   * 更新或设置新闻
   * 业务规则（与老路由完全一致）：
   *   1. 强制 list.company = news.company = user.company
   *   2. 若已存在且 company 不匹配 + 非 admin → 拒绝
   */
  @Post('/setNews', { middleware: ['tokenParse'] })
  @Validate()
  async setNews(@Body(ALL) dto: SetNewsDto) {
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const { news, list } = dto;

    list.company = user?.company;
    news.company = user?.company;

    const n = await this.newsService.getNews(news.title);
    if (n && n.company !== user?.company) {
      return fail('非法修改');
    }
    await this.newsService.setNewsList(list);
    return ok(await this.newsService.setNews(news));
  }

  /**
   * 删除新闻条目
   * 业务规则：若已存在且 company 不匹配 + 非 admin → 拒绝
   */
  @Post('/delNews', { middleware: ['tokenParse'] })
  @Validate()
  async delNews(@Body(ALL) dto: DelNewsDto) {
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const n = await this.newsService.getNews(dto.title);
    if (n && n.company !== user?.company) {
      return fail('非法修改');
    }
    return ok(await this.newsService.delNews(dto.title));
  }
}
