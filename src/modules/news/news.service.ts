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

@Provide()
export class NewsService {
  private newsModel: ReturnModelType<typeof New, types.BeAnObject>;
  private newListModel: ReturnModelType<typeof News_list, types.BeAnObject>;

  @Init()
  async init() {
    this.newsModel = getModelForClass(New);
    this.newListModel = getModelForClass(News_list);
  }

  /**
   * 获取新闻列表 (分页)
   * @param company 组织
   * @param skip 跳过条数 (= (page-1) * pageSize)
   * @param limit 返回条数
   * @returns { items, total } — items 是当页数据, total 是符合条件总数
   */
  async getNewsList(company?: string, skip = 0, limit = 20) {
    const filter = company ? { company } : {};
    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter, {
          img: 1,
          text: 1,
          name: 1,
          time: 1,
          href: 1,
          MainTitle: 1,
          company: 1,
          _id: 0,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.newsModel.countDocuments(filter),
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
