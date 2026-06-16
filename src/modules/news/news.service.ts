/**
 * NewsService（阶段 1.1）
 *
 * 从 src/service/docment.ts 抽出 NewsModel / NewsListModel 的初始化和方法。
 * 行为完全保持一致 — 与 Docments 上同名方法 1:1 对应，调用方 0 改动即可平迁。
 *
 * 切流顺序（Strangler 关键）：
 *  1. 阶段 1.1：NewsService 与 Docments 上的 getNewsList/getNews/... 并行存在；
 *  2. NewsController（新路由 /api/news/*）调 NewsService，老路由 /api/* 调 Docments；
 *  3. 阶段 M2：删 Docments 上对应方法 + 老路由；前端切到新路由。
 *
 * 不动：
 *  - Docments 的 init() 仍初始化所有 model（NewsModel / NewsListModel 也包含）；
 *    NewsService 重复 init 不影响（typegoose 的 getModelForClass 内部缓存）。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { New, News_list } from '../../entity/docment';
import { caseList, cases } from '../../../types/typeing';
import {
  FilterClause,
  FilterOp,
  SortClause,
  parseFilter,
  parseSort,
} from '../../util/filter';

@Provide()
export class NewsService {
  private newsModel: ReturnModelType<typeof New, types.BeAnObject>;
  private newListModel: ReturnModelType<typeof News_list, types.BeAnObject>;

  /**
   * 列表可搜索字段白名单（与 entity 字段对齐：Links + company）。
   * 任何不在这里的 field 都会被 parseFilter 拒绝（防 NoSQL 注入）。
   */
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

  /** 列表可排序字段白名单 */
  static readonly sortableFields = ['time', 'company'] as const;

  /**
   * 每个字段允许的 op 集合（细粒度白名单 — 防止 contains 用于非字符串字段等）。
   * 与 search/sort 白名单取交集才是真正可用的子集。
   */
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

  /** 默认排序：时间倒序（与老 Docments.getNewsList 行为一致） */
  private static readonly defaultSort: Record<string, 1 | -1> = {
    time: -1,
  };

  @Init()
  async init() {
    this.newsModel = getModelForClass(New);
    this.newListModel = getModelForClass(News_list);
  }

  /**
   * 获取新闻列表 (分页 + filter + sort)
   *
   * 调用方（controller）按业务优先级合并 filter：
   *   - site / user.company 是强约束（越权防护），优先级最高
   *   - dto.filter 是用户搜索条件，会与公司约束 AND 合并
   *
   * @param company  公司（来自 site 或 user.company；强制约束）
   * @param skip     跳过条数 (= (page-1) * pageSize)
   * @param limit    返回条数
   * @param filter   用户 filter 子句（走白名单 + parseFilter 防注入）
   * @param sort     用户 sort 子句（走白名单 + parseSort 防注入）
   * @returns { items, total }
   */
  async getNewsList(
    company?: string,
    skip = 0,
    limit = 20,
    filter?: FilterClause[],
    sort?: SortClause[]
  ) {
    const companyFilter = company ? { company } : {};
    const userFilter = parseFilter(filter, NewsService.searchableFields);
    const merged = { ...companyFilter, ...userFilter };

    const userSort = parseSort(sort, NewsService.sortableFields);
    const sortSpec =
      Object.keys(userSort).length > 0 ? userSort : NewsService.defaultSort;

    const [items, total] = await Promise.all([
      this.newsModel
        .find(merged, NewsService.projection)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.newsModel.countDocuments(merged),
    ]);
    return { items, total };
  }

  /**
   * 获取新闻条目详情
   * @param title
   */
  async getNews(title: string) {
    return await this.newListModel.findOne({ title }).lean();
  }

  /**
   * 获取新闻列表单例
   * @param title
   */
  async getNewsListOne(title: string) {
    return await this.newsModel.findOne({ text: title }).lean();
  }

  /**
   * 设置或更新新闻列表条目
   */
  async setNewsList(list: cases) {
    return await this.newsModel
      .updateOne(
        { title: list.title },
        { $set: { ...(list as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 设置或更新新闻详情
   */
  async setNews(news: caseList) {
    return await this.newListModel
      .updateOne(
        { title: news.title },
        { $set: { ...(news as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除新闻条目（同时删列表条目 + 详情条目）
   */
  async delNews(title: string) {
    await this.newsModel.deleteOne({ text: title });
    return await this.newListModel.deleteOne({ title });
  }
}
