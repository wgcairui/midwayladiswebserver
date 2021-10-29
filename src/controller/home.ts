import { Controller, Get, Inject, Post, Provide } from '@midwayjs/decorator';
import { UserService } from '../service/user';

@Provide()
@Controller('/')
export class HomeController {
  @Inject()
  UserService: UserService;

  @Get('/')
  @Post('/')
  async home() {
    return 'Hello Midwayjs!';
  }
}
