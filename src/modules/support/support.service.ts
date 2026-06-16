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

@Provide()
export class SupportService {
  private supportModel: ReturnModelType<typeof Support, types.BeAnObject>;
  private supportListModel: ReturnModelType<
    typeof Support_list,
    types.BeAnObject
  >;

  @Init()
  async init() {
    this.supportModel = getModelForClass(Support);
    this.supportListModel = getModelForClass(Support_list);
  }

  // ---- softs (技术支持) ----

  /**
   * 获取所有技术支持资源
   */
  async getSofts() {
    return await this.supportModel.find().lean();
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
   * 获取所有常见问题
   */
  async getProblems() {
    return await this.supportListModel.find().lean();
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
