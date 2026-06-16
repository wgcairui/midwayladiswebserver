/**
 * CaseController（阶段 1.1）
 *
 * 新路由前缀：/api/case/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getCase* /api/setCase /api/delCase
 *
 * 业务规则与 NewsController 1:1 对称。
 */
import {
  ALL,
  Body,
  Controller,
  Inject,
  Post,
  Provide,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { CaseService } from './case.service';
import { fail, normalizePagination, ok, paginated } from '../../util/response';
import { Wrap } from '../../middleware/response';
import {
  DelCaseDto,
  GetCaseDto,
  GetCaseListDto,
  GetCaseListOneDto,
  SetCaseDto,
} from './case.dto';

@Provide()
@Controller('/api/case')
export class CaseController {
  @Inject()
  ctx: Context;

  @Inject()
  caseService: CaseService;

  /**
   * 获取案例列表
   * 老入参：@Body() user, @Body() site? —— site 优先 + fallback
   * 新增：filter / sort（多维度搜索/排序）
   *
   * 注意：不挂 @Validate()（与 PR #10 教训一致 — tokenParse 注入 user），
   * filter/sort 字段合法性在 service 层 parseFilter/parseSort 兜底。
   */
  @Post('/getCaseList', { middleware: ['tokenParse'] })
  @Wrap()
  async getCaseList(@Body(ALL) dto: GetCaseListDto) {
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const site = dto?.site;
    const { filter, sort } = dto || {};
    const { skip, page, pageSize } = normalizePagination(dto);
    if (site) {
      const { items, total } = await this.caseService.getCaseList(
        site,
        skip,
        pageSize,
        filter,
        sort
      );
      if (items.length > 0) return paginated(items, total, page, pageSize);
    }
    const { items, total } = await this.caseService.getCaseList(
      user?.company,
      skip,
      pageSize,
      filter,
      sort
    );
    return paginated(items, total, page, pageSize);
  }

  /**
   * 获取案例详情
   */
  @Post('/getCase')
  async getCase(@Body(ALL) dto: GetCaseDto) {
    return ok(await this.caseService.getCase(dto?.title));
  }

  /**
   * 获取案例列表单例
   */
  @Post('/getCaseListOne')
  async getCaseListOne(@Body(ALL) dto: GetCaseListOneDto) {
    return ok(await this.caseService.getCaseListOne(dto?.title));
  }

  /**
   * 更新或设置案例
   * 业务规则（与老路由完全一致）：
   *   1. 强制 list.company = cases.company = user.company
   *   2. 若已存在且 company 不匹配 + 非 admin → 拒绝
   */
  @Post('/setCase', { middleware: ['tokenParse'] })
  async setCase(@Body(ALL) dto: SetCaseDto) {
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const { cases, list } = dto;

    const n = await this.caseService.getCase(cases.title);
    if (n && n.company !== user?.company) {
      return fail('非法修改');
    }
    list.company = user?.company;
    cases.company = user?.company;
    await this.caseService.setCaseList(list);
    return ok(await this.caseService.setCase(cases));
  }

  /**
   * 删除案例条目
   * 业务规则：若已存在且 company 不匹配 + 非 admin → 拒绝
   */
  @Post('/delCase', { middleware: ['tokenParse'] })
  async delCase(@Body(ALL) dto: DelCaseDto) {
    const user = (this.ctx.request.body as any).user as Uart.UserInfo;
    const n = await this.caseService.getCase(dto?.title);
    if (n && n.company !== user?.company) {
      return fail('非法修改');
    }
    return ok(await this.caseService.delCase(dto?.title));
  }
}
