/**
 * CaseService（阶段 1.1）
 *
 * 与 NewsService 1:1 对称，从 src/service/docment.ts 抽出 CaseModel / CaseListModel。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { Case, Case_list } from '../../entity/docment';
import { caseList, cases } from '../../../types/typeing';

@Provide()
export class CaseService {
  private caseModel: ReturnModelType<typeof Case, types.BeAnObject>;
  private caseListModel: ReturnModelType<typeof Case_list, types.BeAnObject>;

  @Init()
  async init() {
    this.caseModel = getModelForClass(Case);
    this.caseListModel = getModelForClass(Case_list);
  }

  /**
   * 获取案例列表
   * @param company 组织
   */
  async getCaseList(company?: string, skip = 0, limit = 20) {
    const filter = company ? { company } : {};
    const [items, total] = await Promise.all([
      this.caseModel
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
      this.caseModel.countDocuments(filter),
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
