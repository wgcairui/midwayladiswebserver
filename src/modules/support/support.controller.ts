/**
 * SupportController（阶段 1.3）
 *
 * 新路由前缀：/api/support/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getSofts /api/getSoft /api/setSoft
 *                                          /api/delSoft /api/getProblems /api/getProblem
 *                                          /api/setProblem /api/delProblem
 *
 * softs (技术支持) + problems (常见问题) 共用 Support / Support_list entity，
 * 合并到一个 controller。set/del 路由挂 tokenParse。
 *
 * 注：tokenParse 中间件会在 ctx.request.body 注入 `user` 字段；midway 的
 * `@Validate()` 用 `Joi.object(rules)`（默认 unknown=false）校验整个 body，
 * 会因 `user` 字段报 "user is not allowed" 错。所以挂 tokenParse 的 set/del
 * 路由**不挂** `@Body(ALL)` 也不走 DTO 校验，直接从 `ctx.request.body` 取
 * 字段 + service 写入；这与阶段 1.1 news/case 的 set/del 同病（已在那个
 * 分支遗留），本任务只确保 support 自洽。
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
import { SupportService } from './support.service';
import { normalizePagination, ok, paginated } from '../../util/response';
import {
  GetProblemDto,
  GetProblemsDto,
  GetSoftDto,
  GetSoftsDto,
} from './support.dto';

@Provide()
@Controller('/api/support')
export class SupportController {
  @Inject()
  ctx: Context;

  @Inject()
  supportService: SupportService;

  // ---- softs (技术支持) ----

  /**
   * 获取所有技术支持资源 (分页)
   */
  @Post('/getSofts')
  @Validate()
  async getSofts(@Body(ALL) dto: GetSoftsDto) {
    const { skip, page, pageSize } = normalizePagination(dto);
    const { items, total } = await this.supportService.getSofts(skip, pageSize);
    return paginated(items, total, page, pageSize);
  }

  /**
   * 获取指定技术支持资源
   */
  @Post('/getSoft')
  @Validate()
  async getSoft(@Body(ALL) dto: GetSoftDto) {
    return ok(await this.supportService.getSoft(dto.title));
  }

  /**
   * 设置或更新技术支持资源（tokenParse 注入 user，不走 DTO 校验）
   */
  @Post('/setSoft', { middleware: ['tokenParse'] })
  async setSoft() {
    const body = this.ctx.request.body as any;
    return ok(await this.supportService.setSoft(body.item));
  }

  /**
   * 删除技术支持资源（tokenParse 注入 user，不走 DTO 校验）
   */
  @Post('/delSoft', { middleware: ['tokenParse'] })
  async delSoft() {
    const body = this.ctx.request.body as any;
    return ok(await this.supportService.delSoft(body.title));
  }

  // ---- problems (常见问题) ----

  /**
   * 获取所有常见问题 (分页)
   */
  @Post('/getProblems')
  @Validate()
  async getProblems(@Body(ALL) dto: GetProblemsDto) {
    const { skip, page, pageSize } = normalizePagination(dto);
    const { items, total } = await this.supportService.getProblems(skip, pageSize);
    return paginated(items, total, page, pageSize);
  }

  /**
   * 获取指定常见问题
   */
  @Post('/getProblem')
  @Validate()
  async getProblem(@Body(ALL) dto: GetProblemDto) {
    return ok(await this.supportService.getProblem(dto.title));
  }

  /**
   * 设置或更新常见问题（tokenParse 注入 user，不走 DTO 校验）
   */
  @Post('/setProblem', { middleware: ['tokenParse'] })
  async setProblem() {
    const body = this.ctx.request.body as any;
    return ok(await this.supportService.setProblem(body.item));
  }

  /**
   * 删除常见问题（tokenParse 注入 user，不走 DTO 校验）
   */
  @Post('/delProblem', { middleware: ['tokenParse'] })
  async delProblem() {
    const body = this.ctx.request.body as any;
    return ok(await this.supportService.delProblem(body.title));
  }
}
