/**
 * LinksController（阶段 1.3）
 *
 * 新路由前缀：/api/links/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getLinks /api/setLinks
 *
 * 行为 / 入参 / 返参 shape 100% 保持兼容：
 *  - 成功：{ code: 200, data: ... }
 *  - 失败：{ code: 0, msg: 'xxx' }（保留老前端习惯）
 *
 * 权限规则（与老路由完全一致）：
 *  - getLinks 无 token（公开）
 *  - setLinks 必须有 tokenParse（中间件挂在路由上）
 */
import {
  Body,
  Controller,
  Inject,
  Post,
  Provide,
  Validate,
} from '@midwayjs/decorator';
import { LinksService } from './links.service';
import { ok } from '../../util/response';
import { SetLinksDto } from './links.dto';

@Provide()
@Controller('/api/links')
export class LinksController {
  @Inject()
  linksService: LinksService;

  /**
   * 获取友链
   * 老路由：POST /api/getLinks（无入参）
   */
  @Post('/getLinks')
  async getLinks() {
    return ok(await this.linksService.getLinks());
  }

  /**
   * 设置友链
   * 老路由：POST /api/setLinks（name, link）
   */
  @Post('/setLinks', { middleware: ['tokenParse'] })
  @Validate()
  async setLinks(@Body() dto: SetLinksDto) {
    return ok(await this.linksService.setLinks(dto.name, dto.link));
  }
}
