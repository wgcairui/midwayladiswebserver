/**
 * SupportService（阶段 1.3）
 *
 * softs (技术支持) + problems (常见问题) 共用 Support / Support_list entity，
 * 合并为一个 service 暴露 8 个方法。其它 list-page helper
 * （getSupportType / getSupportListsType / getSupportLists /
 *  getSupportList / getSupport）继续留在老 Docments，本阶段不抽。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { Support, Support_list } from '../../entity/docment';
import { support, supportList } from '../../../types/typeing';
import {
  FilterClause,
  FilterOp,
  SortClause,
  parseFilter,
  parseSort,
} from '../../util/filter';

@Provide()
export class SupportService {
  private supportModel: ReturnModelType<typeof Support, types.BeAnObject>;
  private supportListModel: ReturnModelType<
    typeof Support_list,
    types.BeAnObject
  >;

  /**
   * Support 实体字段（DocmentBody + Support 自有）：
   *  DocmentBody: PageTitle/Pagekeywords/Pagedescription/MainUrl/MainTitle/
   *               MainParent/title/date/table/href/link
   *  Support:     language/type/platform/size/version/updateReason/down
   *
   * Support_list 实体字段（DocmentBody + Support_list 自有）：
   *  DocmentBody: 同上
   *  Support_list: movie/html/parentsUntil/parent/data
   */
  static readonly softsSearchableFields = [
    'title',
    'language',
    'type',
    'platform',
    'size',
    'version',
    'updateReason',
    'down',
    'date',
    'MainTitle',
    'MainParent',
    'href',
    'link',
    'table',
    'PageTitle',
    'Pagekeywords',
    'Pagedescription',
    'MainUrl',
  ] as const;

  static readonly softsSortableFields = ['title', 'date'] as const;

  static readonly softsFilterOps: Record<string, readonly FilterOp[]> = {
    title: ['contains', 'eq'],
    language: ['contains', 'eq'],
    type: ['contains', 'eq'],
    platform: ['contains', 'eq'],
    size: ['contains', 'eq'],
    version: ['contains', 'eq'],
    updateReason: ['contains', 'eq'],
    down: ['contains', 'eq'],
    date: ['eq', 'gte', 'lte'],
    MainTitle: ['contains', 'eq'],
    MainParent: ['contains', 'eq'],
    href: ['contains', 'eq'],
    link: ['contains', 'eq'],
    table: ['contains', 'eq'],
    PageTitle: ['contains', 'eq'],
    Pagekeywords: ['contains', 'eq'],
    Pagedescription: ['contains', 'eq'],
    MainUrl: ['contains', 'eq'],
  };

  static readonly problemsSearchableFields = [
    'title',
    'movie',
    'html',
    'parentsUntil',
    'parent',
    'data',
    'date',
    'MainTitle',
    'MainParent',
    'href',
    'link',
    'table',
    'PageTitle',
    'Pagekeywords',
    'Pagedescription',
    'MainUrl',
  ] as const;

  static readonly problemsSortableFields = ['title', 'date'] as const;

  static readonly problemsFilterOps: Record<string, readonly FilterOp[]> = {
    title: ['contains', 'eq'],
    movie: ['contains', 'eq'],
    html: ['contains', 'eq'],
    parentsUntil: ['contains', 'eq'],
    parent: ['contains', 'eq'],
    data: ['contains', 'eq'],
    date: ['eq', 'gte', 'lte'],
    MainTitle: ['contains', 'eq'],
    MainParent: ['contains', 'eq'],
    href: ['contains', 'eq'],
    link: ['contains', 'eq'],
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
    this.supportModel = getModelForClass(Support);
    this.supportListModel = getModelForClass(Support_list);
  }

  // ---- softs (技术支持) ----

  /**
   * 获取所有技术支持资源 (分页 + filter + sort)
   */
  async getSofts(
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const merged = parseFilter(filter, SupportService.softsSearchableFields);

    const userSort = parseSort(sort, SupportService.softsSortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : SupportService.defaultSort;

    const [items, total] = await Promise.all([
      this.supportModel
        .find(merged)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.supportModel.countDocuments(merged),
    ]);
    return { items, total };
  }

  /**
   * 获取指定技术支持资源
   * @param title
   */
  async getSoft(title: string) {
    return await this.supportModel.findOne({ title }).lean();
  }

  /**
   * 设置或更新技术支持资源
   * @param item
   */
  async setSoft(item: support) {
    return await this.supportModel
      .updateOne(
        { title: item.title },
        { $set: { ...(item as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除技术支持资源
   * @param title
   */
  async delSoft(title: string) {
    return await this.supportModel.deleteOne({ title });
  }

  // ---- problems (常见问题) ----

  /**
   * 获取所有常见问题 (分页 + filter + sort)
   */
  async getProblems(
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const merged = parseFilter(
      filter,
      SupportService.problemsSearchableFields
    );

    const userSort = parseSort(sort, SupportService.problemsSortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : SupportService.defaultSort;

    const [items, total] = await Promise.all([
      this.supportListModel
        .find(merged)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.supportListModel.countDocuments(merged),
    ]);
    return { items, total };
  }

  /**
   * 获取指定常见问题
   * @param title
   */
  async getProblem(title: string) {
    return await this.supportListModel.findOne({ title }).lean();
  }

  /**
   * 设置或更新常见问题
   * @param item
   */
  async setProblem(item: supportList) {
    return await this.supportListModel
      .updateOne(
        { title: item.title },
        { $set: { ...(item as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除常见问题
   * @param title
   */
  async delProblem(title: string) {
    return await this.supportListModel.deleteOne({ title });
  }
}
