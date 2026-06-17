import { Init, Inject, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import { User } from '../entity/user';
import { Util } from '../util/util';

/**
 * 用户数据相关的service
 */
@Provide()
export class UserService {
  @Inject()
  Util: Util;

  userModel: ReturnModelType<typeof User, types.BeAnObject>;

  @Init()
  async init() {
    this.userModel = getModelForClass<typeof User>(User, {
      schemaOptions: { timestamps: true },
    });
  }
  /**
   * 获取单个用户数据
   * @param user 用户名
   * @returns
   */
  async getUser(user: string) {
    return await this.userModel.findOne({ $or: [{ user }, { mail: user }] });
  }

  /**
   * 添加用户
   * @param user
   * @returns
   */
  async saveUser(user: Uart.UserInfo) {
    return await this.userModel.create(user as any);
  }

  /**
   * 更新用户资料（用户名不能改）
   * @param user 当前用户
   * @param patch 要更新的字段（name/avanter/company/userGroup）
   */
  async updateProfile(user: Uart.UserInfo, patch: Partial<Uart.UserInfo>) {
    const allowed: (keyof Uart.UserInfo)[] = ['name', 'avanter', 'company', 'userGroup']
    const safe: any = {}
    for (const k of allowed) {
      if (patch[k] !== undefined) safe[k] = patch[k]
    }
    return await this.userModel.findOneAndUpdate(
      { user: user.user },
      { $set: safe },
      { new: true }
    )
  }

  /**
   * 修改密码
   * @param user 当前用户
   * @param oldPass 旧明文密码
   * @param newPass 新明文密码
   */
  async changePassword(user: Uart.UserInfo, oldPass: string, newPass: string) {
    const u = await this.userModel.findOne({ user: user.user })
    if (!u) throw new Error('用户不存在')
    if (u.passwd !== this.Util.Crypto_Encrypto(oldPass)) {
      throw new Error('旧密码不正确')
    }
    if (!newPass || newPass.length < 6) {
      throw new Error('新密码至少 6 位')
    }
    u.passwd = this.Util.Crypto_Encrypto(newPass)
    await u.save()
    return true
  }
}
