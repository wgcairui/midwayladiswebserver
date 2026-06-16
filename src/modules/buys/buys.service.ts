/**
 * BuysService（阶段 1.3）
 *
 * 从 src/service/docment.ts 抽出 BuyListModel 的初始化和方法。
 * 行为完全保持一致 — 与 Docments 上同名方法 1:1 对应，调用方 0 改动即可平迁。
 *
 * 切流顺序（Strangler 关键）：
 *  1. 阶段 1.3：BuysService 与 Docments 上的 getBuys/getBuy/... 并行存在；
 *  2. BuysController（新路由 /api/buys/*）调 BuysService，老路由 /api/* 调 Docments；
 *  3. 阶段 M2：删 Docments 上对应方法 + 老路由；前端切到新路由。
 *
 * 不抽（留在 docment.ts，跨 entity 老 caller 仍在用）：
 *  - getBuysAll() — 用 BuyModel，跨 entity
 *  - getBuyListLink(link) — 跟 list helper 混一起
 *
 * 不动：
 *  - Docments 的 init() 仍初始化所有 model（BuyModel / BuyListModel 也包含）；
 *    BuysService 重复 init 不影响（typegoose 的 getModelForClass 内部缓存）。
 */
import { Init, Provide } from '@midwayjs/decorator';
import {
  ReturnModelType,
  getModelForClass,
  types,
} from '@typegoose/typegoose';
import { Buy_list } from '../../entity/docment';
import { buyList } from '../../../types/typeing';

@Provide()
export class BuysService {
  private buyListModel: ReturnModelType<
    typeof Buy_list,
    types.BeAnObject
  >;

  @Init()
  async init() {
    this.buyListModel = getModelForClass(Buy_list);
  }

  /**
   * 获取经销商列表 (分页)
   * @param skip 跳过条数
   * @param limit 返回条数
   */
  async getBuys(skip = 0, limit = 20) {
    const [items, total] = await Promise.all([
      this.buyListModel.find().skip(skip).limit(limit).lean(),
      this.buyListModel.countDocuments(),
    ]);
    return { items, total };
  }

  /**
   * 获取指定经销商信息
   * @param title
   */
  getBuy(title: string) {
    return this.buyListModel.findOne({ title }).lean();
  }

  /**
   * 删除指定经销商
   * @param title
   */
  async delBuy(title: string) {
    return await this.buyListModel.deleteOne({ title });
  }

  /**
   * 设置经销商（upsert）
   * @param buy
   * @returns
   */
  setBuy(buy: buyList) {
    return this.buyListModel.updateOne(
      { title: buy.title },
      { $set: { ...buy } as any },
      { upsert: true }
    );
  }
}