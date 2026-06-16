/**
 * BuysController（阶段 1.3）
 *
 * 新路由前缀：/api/buys/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getBuys /api/getBuy /api/delBuy /api/setBuy
 *
 * 行为 / 入参 / 返参 shape 100% 保持兼容：
 *  - 成功：{ code: 200, data: ... }
 *  - 失败：{ code: 0, msg: 'xxx' }（保留老前端习惯）
 *
 * 权限规则（与老路由完全一致 — 公开接口，无 tokenParse）：
 *  - 老的 /api/getBuys /api/getBuy /api/delBuy /api/setBuy 都没有 tokenParse；
 *  - 保持公开，等价迁移到 /api/buys/*。
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
import { BuysService } from './buys.service';
import { normalizePagination, ok, paginated } from '../../util/response';
import { Wrap } from '../../middleware/response';
import { DelBuyDto, GetBuyDto, GetBuysDto, SetBuyDto } from './buys.dto';

@Provide()
@Controller('/api/buys')
export class BuysController {
  @Inject()
  buysService: BuysService;

  /**
   * 获取经销商列表
   * 老入参：无
   * 新增：filter / sort（多维度搜索/排序）
   *
   * 公开接口，可挂 @Validate()（joi 不会因 user 字段报错）。
   * filter/sort 字段合法性在 service 层 parseFilter/parseSort 兜底。
   */
  @Post('/getBuys')
  @Validate()
  @Wrap()
  async getBuys(@Body(ALL) dto: GetBuysDto) {
    const { filter, sort } = dto || {};
    const { skip, page, pageSize } = normalizePagination(dto);
    const { items, total } = await this.buysService.getBuys(
      skip,
      pageSize,
      filter,
      sort
    );
    return paginated(items, total, page, pageSize);
  }

  /**
   * 获取指定经销商信息
   * 老入参：@Body() title: string
   */
  @Post('/getBuy')
  @Validate()
  async getBuy(@Body(ALL) dto: GetBuyDto) {
    return ok(await this.buysService.getBuy(dto.title));
  }

  /**
   * 删除指定经销商
   * 老入参：@Body() title: string
   */
  @Post('/delBuy')
  @Validate()
  async delBuy(@Body(ALL) dto: DelBuyDto) {
    return ok(await this.buysService.delBuy(dto.title));
  }

  /**
   * 设置经销商
   * 老入参：@Body() buy: buyList
   */
  @Post('/setBuy')
  @Validate()
  async setBuy(@Body(ALL) dto: SetBuyDto) {
    return ok(await this.buysService.setBuy(dto.buy));
  }
}