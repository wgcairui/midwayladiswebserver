/**
 * ProductsService（阶段 1.3）
 *
 * 从 src/service/docment.ts 抽出 ProductModel / ProductListModel 的初始化和方法。
 * 行为完全保持一致 — 与 Docments 上同名方法 1:1 对应，调用方 0 改动即可平迁。
 *
 * 与 buys / softs 不同：setProduct 是双入参（product + list），
 * 分别写到 ProductModel 和 ProductListModel，老实现就是这样。
 *
 * 切流顺序（Strangler 关键）：
 *  1. 阶段 1.3：ProductsService 与 Docments 上的 getProducts/getProduct/... 并行存在；
 *  2. ProductsController（新路由 /api/products/*）调 ProductsService，老路由 /api/* 调 Docments；
 *  3. 阶段 M2：删 Docments 上对应方法 + 老路由；前端切到新路由。
 *
 * 不抽（留在 docment.ts，跨 entity 或其他 caller 仍在用）：
 *  - getProductsType(type) — 用 productModel 但 pick 字段筛选（与 set/get 无关）
 *  - getProductsReg(str)   — 同上，正则匹配
 *  - getProductList(link)  — 用 productListModel 但走 this.pick 字段
 *  - updateData() 里对 productModel 的批量 upsert — 爬虫路径，跨业务
 *
 * 不动：
 *  - Docments 的 init() 仍初始化所有 model（ProductModel / ProductListModel 也包含）；
 *    ProductsService 重复 init 不影响（typegoose 的 getModelForClass 内部缓存）。
 */
import { Init, Provide } from '@midwayjs/decorator';
import {
  ReturnModelType,
  getModelForClass,
  types,
} from '@typegoose/typegoose';
import { Product, Product_list } from '../../entity/docment';
import { product, productList } from '../../../types/typeing';

@Provide()
export class ProductsService {
  private productModel: ReturnModelType<typeof Product, types.BeAnObject>;
  private productListModel: ReturnModelType<
    typeof Product_list,
    types.BeAnObject
  >;

  @Init()
  async init() {
    this.productModel = getModelForClass(Product);
    this.productListModel = getModelForClass(Product_list);
  }

  /**
   * 获取产品列表 (分页)
   */
  async getProducts(skip = 0, limit = 20) {
    const [items, total] = await Promise.all([
      this.productModel.find().skip(skip).limit(limit).lean(),
      this.productModel.countDocuments(),
    ]);
    return { items, total };
  }

  /**
   * 获取产品详情
   * @param title
   * @returns
   */
  getProduct(title: string) {
    return this.productListModel.findOne({ title }).lean();
  }

  /**
   * 设置产品（双写：product 写到 ProductModel，list 写到 ProductListModel）
   * @param product 产品列表条目
   * @param list    产品详情条目
   * @returns
   */
  async setProduct(product: product, list: productList) {
    await this.productModel.updateOne(
      { title: product.title },
      { $set: { ...(product as any) } },
      { upsert: true }
    );
    return await this.productListModel.updateOne(
      { title: list.title },
      { $set: { ...(list as any) } },
      { upsert: true }
    );
  }

  /**
   * 删除产品详情（只删 Product_list，与老实现一致）
   * @param title
   * @returns
   */
  delProduct(title: string) {
    return this.productListModel.deleteOne({ title });
  }
}