/**
 * CaseService（阶段 1.1）
 *
 * 与 NewsService 1:1 对称，从 src/service/docment.ts 抽出 CaseModel / CaseListModel。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { Case, Case_list } from '../../entity/docment';
import { caseList, cases } from '../../../types/typeing';
import {
  FilterClause,
  FilterOp,
  SortClause,
  parseFilter,
  parseSort,
} from '../../util/filter';

@Provide()
export class CaseService {
  private caseModel: ReturnModelType<typeof Case, types.BeAnObject>;
  private caseListModel: ReturnModelType<typeof Case_list, types.BeAnObject>;

  /** 案例列表可搜索字段白名单（与 Case entity 字段对齐：Links + company） */
  static readonly searchableFields = [
    'img',
    'text',
    'name',
    'time',
    'href',
    'link',
    'linkText',
    'MainTitle',
    'company',
  ] as const;

  /** 案例列表可排序字段白名单 */
  static readonly sortableFields = ['time', 'company'] as const;

  /** 每个字段允许的 op 集合（细粒度白名单） */
  static readonly filterOps: Record<string, readonly FilterOp[]> = {
    text: ['contains', 'eq'],
    name: ['contains', 'eq'],
    href: ['contains', 'eq'],
    link: ['contains', 'eq'],
    linkText: ['contains', 'eq'],
    MainTitle: ['contains', 'eq'],
    img: ['contains', 'eq'],
    time: ['eq', 'gte', 'lte'],
    company: ['eq', 'in'],
  };

  /** 列表投影字段（与老实现保持一致） */
  private static readonly projection = {
    img: 1,
    text: 1,
    name: 1,
    time: 1,
    href: 1,
    MainTitle: 1,
    company: 1,
    _id: 0,
  } as const;

  /** 默认排序：时间倒序 */
  private static readonly defaultSort: Record<string, 1 | -1> = {
    time: -1,
  };

  @Init()
  async init() {
    this.caseModel = getModelForClass(Case);
    this.caseListModel = getModelForClass(Case_list);
  }

  /**
   * 获取案例列表 (分页 + filter + sort)
   *
   * @param company  公司（来自 site 或 user.company；强制约束）
   * @param skip     跳过条数
   * @param limit    返回条数
   * @param filter   用户 filter 子句（走白名单 + parseFilter 防注入）
   * @param sort     用户 sort 子句（走白名单 + parseSort 防注入）
   */
  async getCaseList(
    company?: string,
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const companyFilter = company ? { company } : {};
    const userFilter = parseFilter(filter, CaseService.searchableFields);
    const merged = { ...companyFilter, ...userFilter };

    const userSort = parseSort(sort, CaseService.sortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : CaseService.defaultSort;

    const [items, total] = await Promise.all([
      this.caseModel
        .find(merged, CaseService.projection)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.caseModel.countDocuments(merged),
    ]);
    return { items, total };
  }

  /**
   * 获取案例详情
   * @param title
   */
  async getCase(title: string) {
    return await this.caseListModel.findOne({ title }).lean();
  }

  /**
   * 获取案例列表单例
   * @param title
   */
  async getCaseListOne(title: string) {
    return await this.caseModel.findOne({ text: title }).lean();
  }

  /**
   * 设置或更新案例列表条目
   */
  async setCaseList(list: cases) {
    return await this.caseModel
      .updateOne(
        { title: list.title },
        { $set: { ...(list as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 设置或更新案例详情
   */
  async setCase(cases: caseList) {
    return await this.caseListModel
      .updateOne(
        { title: cases.title },
        { $set: { ...(cases as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除案例条目（同时删列表条目 + 详情条目）
   */
  async delCase(title: string) {
    await this.caseModel.deleteOne({ text: title });
    return await this.caseListModel.deleteOne({ title });
  }
}
