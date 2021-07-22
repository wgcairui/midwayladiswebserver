import { Body, Controller, Get, Inject, Post, Provide } from "@midwayjs/decorator";
import { parse, join } from "path"
import { Context } from "@midwayjs/koa";
import { FileDU } from "../service/file"

import { existsSync, createReadStream } from "fs"

@Provide()
@Controller()
export class FileOprate {

    @Inject()
    ctx: Context

    @Inject()
    FileDU: FileDU

    /**
     * 修改上传的文件名称
     * @param path 
     * @param name 
     * @returns 
     */
    @Post("/api/rename", { middleware: ["tokenParse"] })
    async rename(@Body() user: Uart.UserInfo, @Body() path: string, @Body() name: string) {
        if (user.userGroup !== 'admin') {
            return {
                code: 0,
                msg: 'user error'
            }
        }
        const { dir, ext } = parse(path)
        const newPath = join(__dirname, "../../static", dir, name + ext)
        const oldPath = join(__dirname, "../../static", path)
        return await this.FileDU.rename(newPath, oldPath)
    }

    /**
     * 删除上传的文件
     * @param path 
     * @returns 
     */
    @Post("/api/deletefile", { middleware: ["tokenParse"] })
    async deletefile(@Body() user: Uart.UserInfo, @Body() path: string) {
        if (user.userGroup !== 'admin') {
            return {
                code: 0,
                msg: 'user error'
            }
        }
        const filepath = join(__dirname, "../../static", path)
        return {
            code: 200,
            data: await this.FileDU.deleteFile(filepath)
        }
    }

    /**
     * 获取上传文件列表
     * @param name 
     * @returns 
     */
    @Post("/api/getUploadFiles")
    async getUploadFiles(@Body() @Body() name: string) {
        return {
            code: 200,
            data: await this.FileDU.getFilelist("upload", name)
        }
    }

    /**
     * 上传文件
     * @param data 
     */
    @Post("/uploads/files")
    async uploads() {
        const file = [this.ctx.request.files.file].flat()[0]
        return {
            code: 200,
            data: await this.FileDU.upLoad(file)
        }
    }

    /**
     * 下载文件
     * @returns 
     */
    @Get("/down/*")
    @Get("/upload/*")
    @Get("/_CMS_NEWS_IMG_/*")
    @Get("/a_images/*")
    @Get("/docment/Down")
    async file() {

        if (/^(\/upload|\/docment)/.test(this.ctx.path)) {
            const path = join(process.cwd(), this.ctx.path)
            // 如果存在文件
            if (existsSync(path)) {
                return createReadStream(path)
            } else {
                throw new Error(path + " is no file")
            }
        } else {

            const { stat, Path } = await this.FileDU.getFileStatAndDown(this.ctx.originalUrl)
            if (!stat) this.ctx.throw(Path + " is no file2")
            return createReadStream(Path)
        }

    }

}