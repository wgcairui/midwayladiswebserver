import { Provide, Controller, Get, Query, Inject } from '@midwayjs/decorator';
import { Docments } from '../service/docment';

@Provide()
@Controller('/web', { middleware: ['middlewareSitename'] })
export class Site {
  @Inject()
  Docments: Docments;

  /**
   * 获取代理商关于信息
   * @param site
   * @param type
   * @returns
   */
  @Get('/getAboutType')
  async getAboutType(@Query() site: string, @Query() type: string) {
    return await this.Docments.getAboutType(site, type);
  }

  /**
   * 获取所有路由
   * @returns
   */
  @Get('/getRout')
  getRout() {
    return this.Docments.getRout();
  }

  /**
   * 获取所有vr列表
   * @returns
   */
  @Get('/getVrs')
  getVrs() {
    return this.Docments.getVrs();
  }

  /**
   * 获取vr页面
   * @param link
   * @returns
   */
  @Get('/getVr')
  getVr(@Query() link: string) {
    return this.Docments.getVr(link);
  }

  /**
   * 获取经销商列表
   */
  @Get('/getBuyList')
  getBuyList() {
    return this.Docments.getBuys();
  }

  /**
   * 获取所有经销商详细信息
   * @returns
   */
  @Get('/getBuysAll')
  getBuysAll() {
    return this.Docments.getBuysAll();
  }

  /**
   * 获取指定的经销商信息
   * @param link
   * @returns
   */
  @Get('/getBuyListLink')
  getBuyListLink(@Query() link: string) {
    return this.Docments.getBuyListLink(link);
  }

  /**
   * 获取所有案例列表
   * @param site
   */
  @Get('/getCaseLists')
  getCaseLists(@Query() site: string) {
    return this.Docments.getCaseLists(site);
  }

  /**
   * 获取指定类型案例列表
   * @param company
   */
  @Get('/getCaseListsType')
  async getCaseListsType(@Query() site: string, @Query() type: string) {
    return this.Docments.getCaseListsType(site, type);
  }

  /**
   * 获取指定案例
   * @param link
   * @returns
   */
  @Get('/getCaselist')
  getCaselist(@Query() link: string) {
    return this.Docments.getCaselist(link);
  }

  /**
   * 获取所有新闻列表
   * @param site
   */
  @Get('/getNewsLists')
  getNewsLists(@Query() site: string) {
    return this.Docments.getNewsLists(site);
  }

  /**
   * 获取指定类型新闻列表
   * @param company
   */
  @Get('/getNewsListsType')
  async getNewsListsType(@Query() site: string, @Query() type: string) {
    return this.Docments.getNewsListsType(site, type);
  }

  /**
   * 获取指定新闻
   * @param link a
   * @returns
   */
  @Get('/getNewslist')
  getNewslist(@Query() link: string) {
    return this.Docments.getNewslist(link);
  }

  @Get('/getProducts')
  getProducts() {
    return this.Docments.getProducts();
  }

  /**
   * 获取指定产品列表
   * @param type
   * @returns
   */
  @Get('/getProductsType')
  getProductsType(@Query() type: string) {
    return this.Docments.getProductsType(type);
  }

  /**
   * 查询匹配产品信息
   * @param str 通配符
   * @returns
   */
  @Get('/getProductsReg')
  getProductsReg(@Query() str: string) {
    return this.Docments.getProductsReg(str);
  }

  /**
   * 获取指定产品信息
   * @param link
   * @returns
   */
  @Get('/getProductList')
  getProductList(@Query() link: string) {
    return this.Docments.getProductList(link);
  }

  /**
   * 获取侧边栏
   * @param type
   * @returns
   */
  @Get('/getPagesType')
  getPagesType(@Query() type: string) {
    return this.Docments.getPagesType(type);
  }

  /**
   * 获取下载支持
   * @param type
   * @returns
   */
  @Get('/getSupportType')
  getSupportType(@Query() type: string) {
    return this.Docments.getSupportType(type);
  }

  /**
   * 获取教程支持
   * @param type
   * @returns
   */
  @Get('/getSupportListsType')
  getSupportListsType(@Query() type: string) {
    return this.Docments.getSupportListsType(type);
  }

  /**
   * 获取支持单例
   * @param link
   * @returns
   */
  @Get('/getSupportLists')
  getSupportLists() {
    return this.Docments.getSupportLists();
  }

  /**
   * 获取支持单例
   * @param link
   * @returns
   */
  @Get('/getSupportList')
  getSupportList(@Query() link: string) {
    return this.Docments.getSupportList(link);
  }

  /**
   * 获取支持单例
   * @param link
   * @returns
   */
  @Get('/getSupport')
  getSupport(@Query() link: string) {
    return this.Docments.getSupport(link);
  }
}
