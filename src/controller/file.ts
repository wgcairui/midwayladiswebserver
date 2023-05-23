import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Provide,
} from '@midwayjs/decorator';
import { parse, join } from 'path';
import { Context } from '@midwayjs/koa';
import { FileDU } from '../service/file';

import { existsSync, createReadStream } from 'fs';

@Provide()
@Controller()
export class FileOprate {
  @Inject()
  ctx: Context;

  @Inject()
  FileDU: FileDU;

  /**
   * 修改上传的文件名称
   * @param path
   * @param name
   * @returns
   */
  @Post('/api/rename', { middleware: ['tokenParse'] })
  async rename(
    @Body() user: Uart.UserInfo,
    @Body() path: string,
    @Body() name: string
  ) {
    if (user.userGroup === 'admin' || path.includes(user?.company)) {
      const { dir, ext } = parse(path);
      const dirs = join(process.cwd(), 'static');

      const newPath = join(dirs, dir, name + ext);
      const oldPath = join(dirs, path);
      return await this.FileDU.rename(oldPath, newPath);
    } else {
      return {
        code: 0,
        msg: 'user error',
      };
    }
  }

  /**
   * 删除上传的文件
   * @param path
   * @returns
   */
  @Post('/api/deletefile', { middleware: ['tokenParse'] })
  async deletefile(@Body() user: Uart.UserInfo, @Body() path: string) {
    const filepath = join(__dirname, '../../static', path);
    if (filepath.includes(user?.company) || user.userGroup === 'admin') {
      return {
        code: 200,
        data: await this.FileDU.deleteFile(filepath),
      };
    }
    return {
      code: 0,
      msg: 'user error',
    };
  }

  /**
   * 获取上传文件列表
   * @param name
   * @returns
   */
  @Post('/api/getUploadFiles', { middleware: ['tokenParse'] })
  async getUploadFiles(@Body() user: Uart.UserInfo, @Body() name: string) {
    return {
      code: 200,
      data: await this.FileDU.getFilelist('upload', name, user?.company),
    };
  }

  /**
   * 上传文件
   * @param data
   */
  @Post('/uploads/files', { middleware: ['tokenParse'] })
  async uploads(@Body() user: Uart.UserInfo) {
    const file = [this.ctx.request.files.file].flat()[0];
    return {
      code: 200,
      data: await this.FileDU.upLoad(file, user?.company),
    };
  }

  /**
   * 下载文件
   * @returns
   */
  @Get('/down/*')
  @Get('/upload/*')
  @Get('/_CMS_NEWS_IMG_/*')
  @Get('/a_images/*')
  @Get('/docment/Down')
  async file() {
    // if query = xml: '../../../../../../../../../etc/passwd'
    // client can download passwd file of url
    if (Object.keys(this.ctx.query || {}).length > 0) {
      console.log(this.ctx.query);
      this.ctx.throw('please check url', 404);
    }
    if (/^(\/upload|\/docment)/.test(this.ctx.path)) {
      const path = join(process.cwd(), 'static', decodeURI(this.ctx.path));
      // 如果存在文件
      if (existsSync(path)) {
        return createReadStream(path);
      } else {
        throw new Error(path + ' is no file');
      }
    } else {
      const { stat, Path } = await this.FileDU.getFileStatAndDown(
        this.ctx.originalUrl
      );
      if (!stat) this.ctx.throw(Path + ' is no file2');
      return createReadStream(Path);
    }
  }
}
