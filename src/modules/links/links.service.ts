/**
 * LinksService（阶段 1.3）
 *
 * 从 src/service/docment.ts 抽出 linkModel（实体 LinkFrend 来自 src/entity/agent.ts，
 * 注意不在 src/entity/docment.ts）。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { LinkFrend } from '../../entity/agent';
import {
  FilterClause,
  FilterOp,
  SortClause,
  parseFilter,
  parseSort,
} from '../../util/filter';

@Provide()
export class LinksService {
  private linkModel: ReturnModelType<typeof LinkFrend, types.BeAnObject>;

  /**
   * 友链列表可搜索字段白名单（与 LinkFrend entity 字段对齐）。
   * LinkFrend 只有 name + link 两个字段。
   */
  static readonly searchableFields = ['name', 'link'] as const;

  /** 友链列表可排序字段白名单 */
  static readonly sortableFields = ['name', 'link'] as const;

  /** 每个字段允许的 op 集合（细粒度白名单） */
  static readonly filterOps: Record<string, readonly FilterOp[]> = {
    name: ['contains', 'eq'],
    link: ['contains', 'eq'],
  };

  /** 默认排序：name 升序 */
  private static readonly defaultSort: Record<string, 1 | -1> = {
    name: 1,
  };

  @Init()
  async init() {
    this.linkModel = getModelForClass(LinkFrend);
  }

  /**
   * 获取友链 (分页 + filter + sort)
   */
  async getLinks(
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const merged = parseFilter(filter, LinksService.searchableFields);

    const userSort = parseSort(sort, LinksService.sortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : LinksService.defaultSort;

    const [items, total] = await Promise.all([
      this.linkModel
        .find(merged)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.linkModel.countDocuments(merged),
    ]);
    return { items, total };
  }

  /**
   * 设置友链
   * @param name 友链名称
   * @param link 友链 URL
   */
  async setLinks(name: string, link: string) {
    return await this.linkModel
      .updateOne({ name }, { $set: { link } }, { upsert: true })
      .lean();
  }
}
