import { Provide } from "@midwayjs/decorator";
import { join, dirname } from "path"
import * as fs from "fs"
import fetch from "node-fetch"

/**
 * 检查文件链接,如果没有此文件,则链接到官网下载
 */
@Provide()
export class FileDU {
    async getFileStatAndDown(path: string) {
        const ladis = "http://www.ladis.com.cn";
        const enladis = "http://en.ladis.com.cn";
        // 获取请求素材路径
        const filePath = join(__dirname, "../../static", path);
        // 文件获取状态
        let fileGetStat = true;
        const result = {
            stat: fileGetStat,
            Path: filePath,
            fs
        }

        // 如果不存在文件
        if (!fs.existsSync(filePath)) {
            const Path = dirname(filePath)
            // 判断文件夹是否存在，不存在则创建
            if (!fs.existsSync(Path)) fs.mkdirSync(Path, { recursive: true });
            // 创建文件写入流
            const fsStream = fs.createWriteStream(filePath);
            // 创建一个promise，监听到stream关闭返回true
            // 目的为阻塞流程，等待文件被下载再继续响应流程
            const em = new Promise(resolve => {
                fsStream.once("close", () => {
                    console.log(`file ${path} is down`);
                    resolve(true);
                });
            });
            // 从ladis中文获取资源
            try {
                const Response = await fetch(ladis + path);
                Response.body.pipe(fsStream)
                await em;
            } catch (error) {
                console.log({ "2": error });
                // 获取失败则从ladis英文获取，
                try {
                    const Response = await fetch(enladis + path);
                    Response.body.pipe(fsStream);
                    await em;
                } catch (error) {
                    console.log({ "1": error });

                    // 获取失败则抛出错误
                    fsStream.removeAllListeners()
                    fileGetStat = false;
                    console.error("ladis no file==" + path);
                }
            }
        }
        return result;
    }

    /**
     * 重命名文件
     * @param oldPath 
     * @param newPath 
     * @returns 
     */
    async rename(oldPath: string, newPath: string) {
        const err = await new Promise(resolve => {
            fs.rename(oldPath, newPath, err => {
                resolve(err)
            })
        })
        return {
            code: err ? 0 : 200,
            msg: err
        }
    }

    /**
     * 删除文件或文件夹
     * @param filepath 
     * @returns 
     */
    async deleteFile(filepath: string) {
        try {
            const filestat = fs.statSync(filepath)
            if (filestat.isDirectory()) {
                fs.rmdirSync(filepath)
            } else {
                fs.rmSync(filepath)
            }
            return {
                code: 200,
                msg: "success"
            }
        } catch (error) {
            return {
                code: 0,
                msg: "操作错误",
                error
            }
        }
    }
}