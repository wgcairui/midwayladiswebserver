/**
 * LinksService（阶段 1.3）
 *
 * 从 src/service/docment.ts 抽出 linkModel（实体 LinkFrend 来自 src/entity/agent.ts，
 * 注意不在 src/entity/docment.ts）。
 */
import { Init, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { LinkFrend } from '../../entity/agent';

@Provide()
export class LinksService {
  private linkModel: ReturnModelType<typeof LinkFrend, types.BeAnObject>;

  @Init()
  async init() {
    this.linkModel = getModelForClass(LinkFrend);
  }

  /**
   * 获取友链 (分页)
   */
  async getLinks(skip = 0, limit = 20) {
    const [items, total] = await Promise.all([
      this.linkModel.find().skip(skip).limit(limit).lean(),
      this.linkModel.countDocuments(),
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
