import { Configuration, App } from '@midwayjs/decorator';
import { Application } from '@midwayjs/koa';
import * as bodyParser from 'koa-body';
import { ILifeCycle } from "@midwayjs/core"
import * as typegoose from "@midwayjs/typegoose"
import * as cache from "@midwayjs/cache"
import { join } from "path"

@Configuration({
  conflictCheck: true,
  imports: [
    typegoose,
    cache
  ],
  importConfigs: [
    join(__dirname, "./config")
  ]
})
export class ContainerLifeCycle implements ILifeCycle {
  @App()
  app: Application;


  async onReady() {
    // bodyparser options see https://github.com/koajs/bodyparser

    this.app.use(bodyParser(
      {
        multipart: true,
        formidable: {
          maxFileSize: (1024 * 1024 * 100) * 100
        }
      }
    ));
  }
}
