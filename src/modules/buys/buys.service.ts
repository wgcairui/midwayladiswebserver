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
import {
  FilterClause,
  FilterOp,
  SortClause,
  parseFilter,
  parseSort,
} from '../../util/filter';

@Provide()
export class BuysService {
  private buyListModel: ReturnModelType<
    typeof Buy_list,
    types.BeAnObject
  >;

  /**
   * 经销商列表可搜索字段白名单（与 Buy_list entity 字段对齐 — 继承 DocmentBody）。
   * DocmentBody 字段：PageTitle / Pagekeywords / Pagedescription / MainUrl /
   *                  MainTitle / MainParent / title / date / table / href / link
   * Buy_list 额外：parentsUntil / parent / content
   */
  static readonly searchableFields = [
    'title',
    'content',
    'parent',
    'parentsUntil',
    'MainTitle',
    'MainParent',
    'href',
    'link',
    'date',
    'table',
    'PageTitle',
    'Pagekeywords',
    'Pagedescription',
    'MainUrl',
  ] as const;

  /** 经销商列表可排序字段白名单 */
  static readonly sortableFields = ['title', 'date'] as const;

  /** 每个字段允许的 op 集合（细粒度白名单） */
  static readonly filterOps: Record<string, readonly FilterOp[]> = {
    title: ['contains', 'eq'],
    content: ['contains', 'eq'],
    parent: ['contains', 'eq'],
    parentsUntil: ['contains', 'eq'],
    MainTitle: ['contains', 'eq'],
    MainParent: ['contains', 'eq'],
    href: ['contains', 'eq'],
    link: ['contains', 'eq'],
    date: ['eq', 'gte', 'lte'],
    table: ['contains', 'eq'],
    PageTitle: ['contains', 'eq'],
    Pagekeywords: ['contains', 'eq'],
    Pagedescription: ['contains', 'eq'],
    MainUrl: ['contains', 'eq'],
  };

  /** 默认排序：title 升序 */
  private static readonly defaultSort: Record<string, 1 | -1> = {
    title: 1,
  };

  @Init()
  async init() {
    this.buyListModel = getModelForClass(Buy_list);
  }

  /**
   * 获取经销商列表 (分页 + filter + sort)
   *
   * @param skip   跳过条数
   * @param limit  返回条数
   * @param filter 用户 filter 子句
   * @param sort   用户 sort 子句
   */
  async getBuys(
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const merged = parseFilter(filter, BuysService.searchableFields);

    const userSort = parseSort(sort, BuysService.sortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : BuysService.defaultSort;

    const [items, total] = await Promise.all([
      this.buyListModel
        .find(merged)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.buyListModel.countDocuments(merged),
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