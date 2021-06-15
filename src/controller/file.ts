import { Body, Controller, Get, Inject, Post, Provide } from "@midwayjs/decorator";
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
    @Post("/api/rename")
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
    @Post("/api/deletefile")
    async deletefile(@Body() path: string) {
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
        const { stat, Path, fs } = await this.FileDU.getFileStatAndDown(this.ctx.originalUrl)
        if (!stat) throw new Error(Path + " is no file")
        return fs.createReadStream(Path)
    }

}