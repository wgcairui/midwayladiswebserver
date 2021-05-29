import { Body, Controller, Get, Inject, Post, Provide, Put } from "@midwayjs/decorator";
import { parse, join } from "path"
import { Context } from "@midwayjs/koa";
import { FileDU } from "../service/file"

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
    @Post("/file/rename")
    async rename(@Body() path: string, @Body() name: string) {
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
    @Post("/file/delete")
    async delete(@Body() path: string) {
        const filepath = join(__dirname, "../../static", path)
        return this.FileDU.deleteFile(filepath)
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
        const { stat, Path, fs } = await this.FileDU.getFileStatAndDown(this.ctx.originalUrl)
        if (!stat) throw new Error(Path + " is no file")
        return fs.createReadStream(Path)
    }

    @Put("/uploads")
    async upload() {

    }
}