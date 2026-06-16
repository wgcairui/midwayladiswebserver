/**
 * ProductsController（阶段 1.3）
 *
 * 新路由前缀：/api/products/*
 * 老路由（仍保留在 src/controller/api.ts）：/api/getProducts /api/getProduct /api/setProduct /api/delProduct
 *
 * 行为 / 入参 / 返参 shape 100% 保持兼容：
 *  - 成功：{ code: 200, data: ... }
 *  - 失败：{ code: 0, msg: 'xxx' }（保留老前端习惯）
 *
 * 权限规则（与 buys / softs 不同 — 写操作加 tokenParse）：
 *  - setProduct / delProduct 必须有 tokenParse（中间件挂在路由上）；
 *  - 老的 /api/setProduct /api/delProduct 本是公开路由，但新产品模块按任务要求加鉴权；
 *    阶段 M2 切换到新路由时，前端需保证带 token。
 *
 * setProduct 是双入参：product（写到 ProductModel）+ list（写到 ProductListModel），
 * 与 buys（单入参）/ softs（单入参）不一样。
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
import { ProductsService } from './products.service';
import { normalizePagination, ok, paginated } from '../../util/response';
import { Wrap } from '../../middleware/response';
import {
  DelProductDto,
  GetProductDto,
  GetProductsDto,
  SetProductDto,
} from './products.dto';

@Provide()
@Controller('/api/products')
export class ProductsController {
  @Inject()
  ctx: Context;

  @Inject()
  productsService: ProductsService;

  /**
   * 获取产品列表 (分页 + filter + sort)
   * 老入参：无
   *
   * 公开接口，可挂 @Validate()（joi 不会因 user 字段报错）。
   * filter/sort 字段合法性在 service 层 parseFilter/parseSort 兜底。
   */
  @Post('/getProducts')
  @Validate()
  @Wrap()
  async getProducts(@Body(ALL) dto: GetProductsDto) {
    const { filter, sort } = dto || {};
    const { skip, page, pageSize } = normalizePagination(dto);
    const { items, total } = await this.productsService.getProducts(
      skip,
      pageSize,
      filter,
      sort
    );
    return paginated(items, total, page, pageSize);
  }

  /**
   * 获取产品详情
   * 老入参：@Body() title: string
   */
  @Post('/getProduct')
  @Validate()
  async getProduct(@Body(ALL) dto: GetProductDto) {
    return ok(await this.productsService.getProduct(dto.title));
  }

  /**
   * 设置产品（双入参：product + list）
   * 老入参：@Body() product: product, @Body() list: productList
   */
  @Post('/setProduct', { middleware: ['tokenParse'] })
  @Validate()
  async setProduct(@Body(ALL) dto: SetProductDto) {
    // tokenParse 注入 user；目前不强制覆盖 company（products 无 company 字段）
    return ok(
      await this.productsService.setProduct(dto.product, dto.list)
    );
  }

  /**
   * 删除产品详情
   * 老入参：@Body() title: string
   */
  @Post('/delProduct', { middleware: ['tokenParse'] })
  @Validate()
  async delProduct(@Body(ALL) dto: DelProductDto) {
    // tokenParse 注入 user；目前不做 company 校验（products 无 company 字段）
    void (this.ctx.request.body as any).user;
    return ok(await this.productsService.delProduct(dto.title));
  }
}