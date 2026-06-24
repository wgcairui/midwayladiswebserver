import { Init, Inject, Provide } from '@midwayjs/decorator';
import { ReturnModelType, getModelForClass, types } from '@typegoose/typegoose';
import * as crypto from 'crypto';
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
   *
   * 注意：存储格式必须与登录流程一致 — `Util.Crypto_Encrypto(md5(plaintext))`。
   * 登录那边前端在 `ladis-admin/pages/login.vue` 把 passwd `md5()` 后发上来，
   * 所以比对/写入都要在 server 端补一次 md5，否则改了反而登不上。
   */
  async changePassword(user: Uart.UserInfo, oldPass: string, newPass: string) {
    const u = await this.userModel.findOne({ user: user.user })
    if (!u) throw new Error('用户不存在')
    const oldMd5 = crypto.createHash('md5').update(oldPass).digest('hex')
    if (u.passwd !== this.Util.Crypto_Encrypto(oldMd5)) {
      throw new Error('旧密码不正确')
    }
    if (!newPass || newPass.length < 6) {
      throw new Error('新密码至少 6 位')
    }
    const newMd5 = crypto.createHash('md5').update(newPass).digest('hex')
    u.passwd = this.Util.Crypto_Encrypto(newMd5)
    await u.save()
    return true
  }
}
