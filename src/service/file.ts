import { Provide } from '@midwayjs/decorator';
import { join, dirname } from 'path';
import * as fs from 'fs';
import { rename } from 'fs/promises';
import fetch from 'node-fetch';
import { promisify } from 'util';
import { fileDirList } from '../../types/typeing';
import { File } from 'formidable';
import * as rmf from 'rimraf';

/**
 * 检查文件链接,如果没有此文件,则链接到官网下载
 */
@Provide()
export class FileDU {
  async getFileStatAndDown(path: string) {
    const ladis = 'http://www.ladis.com.cn';
    // const enladis = "http://en.ladis.com.cn";
    // 获取请求素材路径
    const filePath = join(process.cwd(), 'static', path);
    const result = {
      stat: true,
      Path: filePath,
    };

    // 如果不存在文件
    if (!fs.existsSync(filePath)) {
      const Path = dirname(filePath);
      // 判断文件夹是否存在，不存在则创建

      await fetch(ladis + encodeURI(path))
        .then(async ({ status, body }) => {
          // console.log({ status, url: ladis + encodeURI(path) });

          if (status === 200) {
            if (!fs.existsSync(Path)) fs.mkdirSync(Path, { recursive: true });

            // 创建文件写入流
            const fsStream = fs.createWriteStream(filePath);
            // 创建一个promise，监听到stream关闭返回true
            // 目的为阻塞流程，等待文件被下载再继续响应流程
            const em = new Promise(resolve => {
              fsStream.once('close', () => {
                // console.log(`file ${path} is down`);
                resolve(true);
              });
            });
            body.pipe(fsStream);
            await em;
          } else {
            result.stat = false;
            console.error('ladis no file==' + path);
          }
        })
        .catch(() => {
          result.stat = false;
          console.error('2ladis no file==' + path);
        });
    }
    return result;
  }

  /**
   * 获取文件列表
   * @param path
   * @param name
   */
  async getFilelist(path: string, filter: string) {
    const dir = join(__dirname, '../../static', path);
    // 转换callback to promise
    const readdir = promisify(fs.readdir);
    // 默认结果
    const data: fileDirList = { files: [], size: 0, msg: '' };
    const result = await readdir(dir)
      .then(files => {
        if (!filter || filter === '') {
          data.files = files.map(file => `/${path}/${file}`);
        } else {
          data.files = files
            .filter(file => file.includes(filter))
            .map(file => `/${path}/${file}`);
        }
        data.size = data.files.length;
        return data;
      })
      .catch(e => {
        data.msg = e.message;
        return data;
      });
    return result;
  }

  /**
   * 重命名文件
   * @param oldPath
   * @param newPath
   * @returns
   */
  async rename(oldPath: string, newPath: string) {

    const err = await rename(oldPath, newPath).catch(err => err)
    return {
      code: err ? 0 : 200,
      msg: err,
    };
  }

  /**
   * 删除文件或文件夹
   * @param filepath
   * @returns
   */
  async deleteFile(filepath: string) {
    return new Promise(resolve => {
      const filestat = fs.statSync(filepath);
      if (filestat.isDirectory()) {
        rmf(filepath, err => {
          resolve({
            code: err ? 0 : 200,
            err,
          });
        });
      } else {
        fs.rm(filepath, err => {
          resolve({
            code: err ? 0 : 200,
            err,
          });
        });
      }
    });
  }

  /**
   * 上传文件
   * @param file
   * @returns
   */
  async upLoad(file: File) {
    const uploadDir = join(__dirname, '../../static', 'upload');
    // 检查目录是否存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const name = `${new Date(file.lastModifiedDate)
      .toLocaleDateString()
      .replace(/( |:|:|\/)/g, '_')}_${file.name}`;
    const newPath = `${uploadDir}/${name}`;

    return await new Promise<Record<'name' | 'path' | 'size' | 'type', string>>(
      (resolve, reject) => {
        fs.copyFile(file.path, newPath, err => {
          fs.rm(file.path, err1 => {
            if (err1) console.error(`tempFile rm error, path:${file.path}`);
          });
          if (err) {
            reject(err);
          }

          resolve({
            name,
            path: newPath,
            size: file.size.toString(),
            type: file.type,
          });
        });
      }
    );
  }

  /**
   * 上传文件
   * @param req req对象
   * @param uploadDir 上传文件保存路径
   * @returns
   */
  /* private async Multiparty(req: IncomingMessage, uploadDir: string = "../../static/upload/") {
         // 检查目录是否存在
         if (!fs.existsSync(uploadDir)) {
             fs.mkdirSync(uploadDir, { recursive: true });
         }
         // 新建mul...
         const form = new multiparty.Form({ uploadDir });
         // 构建 Pro
         return new Promise((resolve, reject) => {
             // 解析上传文件
             form.parse(req, (err, fields: any, files) => {
                 if (err) reject(err);
                 console.log({err, fields, files});

                 // fields携带的是附带信息,files是上传文件数组
                 const Files: uploadFile[] = files.files
                 const SaveFiles = Files.map(file => {
                     //
                     const flieNameNew = `${new Date().toLocaleDateString().replace(/( |:|:|\/)/g, "_")}_${file.originalFilename}`
                     const newPath = file.path.replace(basename(file.path), flieNameNew)
                     fs.renameSync(file.path, decodeURI(newPath))
                     // 压缩图片
                     //this.imageCompre(newPath)
                     //获取文件路径相对链接
                     const link = `/${uploadDir}/${flieNameNew}`
                     return {
                         originalFilename: file.originalFilename,
                         name: flieNameNew,
                         path: link,
                         link: link,
                         size: file.size
                     };
                 })
                 resolve(SaveFiles)
             });
         });
     } */

  /**
   * 压缩图片
   * @param path 图片路径
   * @returns
   */
  /* async imageCompre(path: string) {
        const ext = extname(path)
        if (["png", "jpeg", "jpg", "git", "bmp"].includes(ext)) return false
        try {
            await imagemin([path], {
                destination: dirname(path),
                plugins: [
                    imageminJpegtran(),
                    imageminPngquant({
                        quality: [0.6, 0.8]
                    })
                ]
            });
            return true
        } catch (error) {
            return false
        }
    } */
}
