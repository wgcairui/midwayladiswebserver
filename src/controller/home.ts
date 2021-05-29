import { Controller, Get, Inject, Post, Provide } from '@midwayjs/decorator';
import { UserService } from "../service/user"

@Provide()
@Controller('/')
export class HomeController {

  @Inject()
  UserService: UserService

  @Get('/')
  @Post("/")
  async home() {
    const a = await this.UserService.getUser("admin")
    console.log(a);

    return 'Hello Midwayjs!';
  }
}
