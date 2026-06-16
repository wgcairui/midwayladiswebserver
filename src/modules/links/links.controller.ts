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
  ALL,
  Body,
  Controller,
  Inject,
  Post,
  Provide,
} from '@midwayjs/decorator';
import { LinksService } from './links.service';
import { normalizePagination, ok, paginated } from '../../util/response';
import { Wrap } from '../../middleware/response';
import { GetLinksDto, SetLinksDto } from './links.dto';

@Provide()
@Controller('/api/links')
export class LinksController {
  @Inject()
  linksService: LinksService;

  /**
   * 获取友链
   * 老路由：POST /api/getLinks（无入参）
   * 新增：filter / sort（多维度搜索/排序）
   *
   * 公开接口，dto?.filter / dto?.sort 直接读。
   * filter/sort 字段合法性在 service 层 parseFilter/parseSort 兜底。
   */
  @Post('/getLinks')
  @Wrap()
  async getLinks(@Body(ALL) dto: GetLinksDto) {
    const { filter, sort } = dto || {};
    const { skip, page, pageSize } = normalizePagination(dto);
    const { items, total } = await this.linksService.getLinks(
      skip,
      pageSize,
      filter,
      sort
    );
    return paginated(items, total, page, pageSize);
  }

  /**
   * 设置友链
   * 老路由：POST /api/setLinks（name, link）
   */
  @Post('/setLinks', { middleware: ['tokenParse'] })
  async setLinks(@Body() dto: SetLinksDto) {
    return ok(await this.linksService.setLinks(dto?.name, dto?.link));
  }
}
