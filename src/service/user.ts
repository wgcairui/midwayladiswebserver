import { Init, Provide } from '@midwayjs/decorator';
import { getModelForClass, ReturnModelType, types } from "@midwayjs/typegoose"
import { User } from "../entity/user"

/**
 * 用户数据相关的service
 */
@Provide()
export class UserService {

  userModel: ReturnModelType<typeof User, types.BeAnObject>

  @Init()
  async init() {
    this.userModel = getModelForClass(User, { schemaOptions: { timestamps: true } })
  }
  /**
   * 获取单个用户数据
   * @param user 用户名
   * @returns 
   */
  async getUser(user: string) {
    return await this.userModel.findOne({ $or: [{ user }, { mail: user }] })
  }
}