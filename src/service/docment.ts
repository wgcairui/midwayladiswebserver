import { Init, Inject, Provide } from '@midwayjs/decorator';
import {
  buyList,
  caseList,
  cases,
  product,
  productList,
  support,
  supportList,
} from '../../types/typeing';
import { AgentConfig, LinkFrend } from '../entity/agent';
import { Crawler } from '../util/crawler';
import {
  Buy,
  Buy_list,
  Case,
  Case_list,
  New,
  News_list,
  Product,
  Product_list,
  Support,
  Support_list,
  Router,
  VR,
  About,
  Page,
} from '../entity/docment';
import { getModelForClass, ReturnModelType, types } from '@typegoose/typegoose';

/**
 * 获取文档信息
 */

@Provide()
export class Docments {
  @Inject()
  private Crawler: Crawler;

  private agentModel: ReturnModelType<typeof AgentConfig, types.BeAnObject>;
  private newsModel: ReturnModelType<typeof New, types.BeAnObject>;
  private newListModel: ReturnModelType<typeof News_list, types.BeAnObject>;
  private caseModel: ReturnModelType<typeof Case, types.BeAnObject>;
  private caseListModel: ReturnModelType<typeof Case_list, types.BeAnObject>;
  private buyModel: ReturnModelType<typeof Buy, types.BeAnObject>;
  private buyListModel: ReturnModelType<typeof Buy_list, types.BeAnObject>;
  private linkModel: ReturnModelType<typeof LinkFrend, types.BeAnObject>;
  private supportModel: ReturnModelType<typeof Support, types.BeAnObject>;
  private supportListModel: ReturnModelType<
    typeof Support_list,
    types.BeAnObject
  >;
  private productModel: ReturnModelType<typeof Product, types.BeAnObject>;
  private productListModel: ReturnModelType<
    typeof Product_list,
    types.BeAnObject
  >;
  private routeModel: ReturnModelType<typeof Router, types.BeAnObject>;
  private vrModel: ReturnModelType<typeof VR, types.BeAnObject>;
  private aboutModel: ReturnModelType<typeof About, types.BeAnObject>;
  private pageModel: ReturnModelType<typeof Page, types.BeAnObject>;
  private pick: { [x: string]: number };

  @Init()
  async init() {
    this.agentModel = getModelForClass(AgentConfig);
    this.newsModel = getModelForClass(New);
    this.newListModel = getModelForClass(News_list);
    this.caseModel = getModelForClass(Case);
    this.caseListModel = getModelForClass(Case_list);
    this.buyModel = getModelForClass(Buy);
    this.buyListModel = getModelForClass(Buy_list);
    this.linkModel = getModelForClass(LinkFrend);

    this.supportModel = getModelForClass(Support);
    this.supportListModel = getModelForClass(Support_list);

    this.productModel = getModelForClass(Product);
    this.productListModel = getModelForClass(Product_list);

    this.routeModel = getModelForClass(Router);

    this.vrModel = getModelForClass(VR);

    this.aboutModel = getModelForClass(About);

    this.pageModel = getModelForClass(Page);

    this.pick = {
      date: 0,
      table: 0,
      __v: 0,
      _id: 0,
      MainParent: 0,
      MainTitle: 0,
      MainUrl: 0,
    };
  }

  /**
   * 获取代理商配置
   * @param name 代理商名称,没有默认返回全部
   * @returns
   */
  async getAgents(name?: string) {
    return await this.agentModel.find(name ? { name } : {}).lean();
  }

  /**
   * 获取新闻列表单例
   * @param title
   * @returns
   */
  async getNewsListOne(title: string) {
    return await this.newsModel.findOne({ text: title }).lean();
  }

  /**
   * 获取新闻列表
   * @param company 组织
   * @returns
   */
  async getNewsList(company?: string) {
    return await this.newsModel
      .find(company ? { company } : {}, {
        img: 1,
        text: 1,
        name: 1,
        time: 1,
        href: 1,
        MainTitle: 1,
        _id: 0,
      })
      .lean();
  }

  /**
   * 获取新闻条目
   * @param title
   * @returns
   */
  async getNews(title: string) {
    return await this.newListModel.findOne({ title }).lean();
  }

  /**
   * 设置或更新新闻列表
   */
  async setNewsList(list: cases) {
    return await this.newsModel
      .updateOne(
        { title: list.title },
        { $set: { ...(list as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 设置或更新新闻
   */
  async setNews(news: caseList) {
    return await this.newListModel
      .updateOne(
        { title: news.title },
        { $set: { ...(news as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除条目
   */
  async delNews(title: string) {
    await this.newsModel.deleteOne({ text: title });
    return await this.newListModel.deleteOne({ title });
  }

  /**
   * 获取案例列表单例
   * @param title
   * @returns
   */
  async getCaseListOne(title: string) {
    return await this.caseModel.findOne({ text: title }).lean();
  }

  /**
   * 获取案例列表
   * @param company 组织
   * @returns
   */
  async getCaseList(company?: string) {
    return await this.caseModel
      .find(company ? { company } : {}, {
        img: 1,
        text: 1,
        name: 1,
        time: 1,
        href: 1,
        MainTitle: 1,
        _id: 0,
      })
      .lean();
  }

  /**
   * 获取案例条目
   * @param title
   * @returns
   */
  async getCase(title: string) {
    return await this.caseListModel.findOne({ title }).lean();
  }

  /**
   * 设置或更新案例列表
   */
  async setCaseList(list: cases) {
    return await this.caseModel
      .updateOne(
        { title: list.title },
        { $set: { ...(list as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 设置或更新案例
   */
  async setCase(news: caseList) {
    return await this.caseListModel
      .updateOne(
        { title: news.title },
        { $set: { ...(news as any) } },
        { upsert: true }
      )
      .lean();
  }

  /**
   * 删除条目案例
   */
  async delCase(title: string) {
    await this.caseModel.deleteOne({ text: title });
    return await this.caseListModel.deleteOne({ title });
  }

  /**
   * 获取经销商列表
   * @returns
   */
  getBuys() {
    return this.buyListModel.find().lean();
  }

  /**
   * 获取指定经销商信息
   */
  getBuy(title: string) {
    return this.buyListModel.findOne({ title }).lean();
  }

  /**
   * 删除指定经销商
   * @param title
   */
  async delBuy(title: string) {
    return await this.buyListModel.deleteOne({ title });
  }

  /**
   * 设置经销商
   * @param buy
   * @returns
   */
  setBuy(buy: buyList) {
    return this.buyListModel.updateOne(
      { title: buy.title },
      { $set: { ...buy } as any },
      { upsert: true }
    );
  }

  /**
   * 获取友链
   * @returns
   */
  getLinks() {
    return this.linkModel.find().lean();
  }

  /**
   * 设置友链
   * @returns
   */
  setLinks(name: string, link: string) {
    return this.linkModel.updateOne(
      { name },
      { $set: { link } },
      { upsert: true }
    );
  }

  /**
   * 获取所有下载资源
   * @returns
   */
  getSofts() {
    return this.supportModel.find().lean();
  }

  /**
   * 获取指定下载资源
   * @returns
   */
  getSoft(title: string) {
    return this.supportModel.findOne({ title }).lean();
  }

  /**
   * set指定下载资源
   * @returns
   */
  setSoft(item: support) {
    return this.supportModel.updateOne(
      { title: item.title },
      { $set: { ...(item as any) } },
      { upsert: true }
    );
  }

  /**
   * 删除指定下载资源
   * @returns
   */
  delSoft(title: string) {
    return this.supportModel.deleteOne({ title });
  }

  /**
   * 获取所有链接资源
   * @returns
   */
  getProblems() {
    return this.supportListModel.find().lean();
  }

  /**
   * 获取指定链接资源
   * @returns
   */
  getProblem(title: string) {
    return this.supportListModel.findOne({ title }).lean();
  }

  /**
   * set指定链接资源
   * @returns
   */
  setProblem(item: supportList) {
    return this.supportListModel.updateOne(
      { title: item.title },
      { $set: { ...(item as any) } },
      { upsert: true }
    );
  }

  /**
   * del指定链接资源
   * @returns
   */
  delProblem(title: string) {
    return this.supportListModel.deleteOne({ title });
  }

  /**
   * 获取产品列表
   * @returns
   */
  getProducts() {
    return this.productModel.find().lean();
  }

  /**
   * 获取产品详情
   * @param title
   * @returns
   */
  getProduct(title: string) {
    return this.productListModel.findOne({ title }).lean();
  }

  /**
   * set产品详情
   * @param title
   * @returns
   */
  async setProduct(product: product, list: productList) {
    await this.productModel.updateOne(
      { title: product.title },
      { $set: { ...(product as any) } },
      { upsert: true }
    );
    return await this.productListModel.updateOne(
      { title: list.title },
      { $set: { ...(list as any) } },
      { upsert: true }
    );
  }

  /**
   * del产品详情
   * @param title
   * @returns
   */
  delProduct(title: string) {
    return this.productListModel.deleteOne({ title });
  }

  /**
   * 更新数据库
   * @param _al 案例页数
   * @param _xw 新闻页数
   * @returns
   */
  async updateData(_al: number, _xw: number) {
    const now = Date.now();

    {
      const products = [
        //[`/products/index.shtml`, "All"],
        ['/products/node_13.shtml', 'UPS电源'],
        ['/products/node_81.shtml', '后备式UPS电源'],
        ['/products/node_82.shtml', '高频单相UPS电源'],
        ['/products/node_83.shtml', '高频三相UPS电源'],
        ['/products/node_85.shtml', '工频UPS电源'],
        ['/products/node_84.shtml', '机架式UPS电源'],
        ['/products/node_86.shtml', '模块化UPS电源'],
        ['/products/node_87.shtml', 'UPS蓄电池'],
        ['/products/node_10.shtml', '数据中心'],
        ['/products/node_143.shtml', '微模块机房'],
        ['/products/node_135.shtml', '一体化机柜'],
        ['/products/node_978.shtml', '户外一体柜ETC'],
        ['/products/node_11.shtml', '配电PDU'],
        ['/products/node_136.shtml', '动环监控'],
        ['/products/node_138.shtml', '网络机柜'],
        ['/products/node_145.shtml', '机房空调'],
        ['/products/node_148.shtml', '房间空调'],
        ['/products/node_147.shtml', '列间空调'],
        ['/products/node_146.shtml', '机架空调'],
      ];

      console.time('product');
      const all = products.map(async el =>
        (await this.Crawler.loadUrl(el[0], { title: el[1] })).products()
      );
      const result = (await Promise.all(all)).flat();
      console.info(`product:${result.length}`);
      result.forEach(el => {
        this.productModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      });

      for (const iterator of result) {
        const list = (
          await this.Crawler.loadUrl(iterator.link, {
            title: iterator.title,
            parent: iterator.MainTitle,
          })
        ).productList(iterator.title);
        list.forEach(el => {
          this.productListModel
            .updateOne(
              { title: el.title },
              { $set: { ...(el as any) } },
              { upsert: true }
            )
            .exec();
          this.routeModel
            .updateOne({ title: el.title }, { $set: { rout: el.link } })
            .exec();
        });
      }
      console.timeEnd('product');
    }

    {
      const supports = [
        ['/support/node_77.shtml', 'windows', '监控软件下载'],
        ['/support/node_78.shtml', 'linux', '监控软件下载'],
        ['/support/node_79.shtml', 'mac', '监控软件下载'],
        ['/support/node_80.shtml', 'other', '监控软件下载'],
        ['/support/node_89.shtml', '其他产品彩页', '产品彩页说明'],
        ['/support/node_90.shtml', '数据中心彩页', '产品彩页说明'],
        ['/support/node_91.shtml', '机房空调彩页', '产品彩页说明'],
        ['/support/node_92.shtml', 'UPS电源彩页', '产品彩页说明'],
        ['/support/node_96.shtml', 'UPS相关', '证书资质'],
        ['/support/node_95.shtml', '精密空调相关', '证书资质'],
        ['/support/node_94.shtml', '数据中心相关', '证书资质'],
        ['/support/node_93.shtml', '公司相关', '证书资质'],
      ];
      console.time('support');
      const all = supports.map(async el => {
        return (
          await this.Crawler.loadUrl(el[0], { title: el[1], parent: el[2] })
        ).support_down();
      });
      const result = (await Promise.all(all)).flat();
      console.info('support:' + result.length);
      result.forEach(el => {
        this.supportModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      });
      console.timeEnd('support');
    }

    {
      const vrs = [['/360/node_970.shtml'], ['/360/node_969.shtml']];
      console.time('vr');
      const all = vrs.map(async el => {
        return (
          await this.Crawler.loadUrl(el[0], { title: 'vr', parent: 'home' })
        ).caseVrNews('VR');
      });
      const result = (await Promise.all(all)).flat();
      console.info(`vr:${result.length}`);
      result.forEach(el => {
        this.vrModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      });
      console.timeEnd('vr');
    }

    {
      console.time('case');
      const cases = [['/case/index.shtml', 'case', 'home']];
      for (let index = 2; index < _al; index++) {
        cases.push([`/case/index_${index}.shtml`, 'case', 'home']);
      }

      const all = cases.map(async el =>
        (await this.Crawler.loadUrl(el[0], { title: el[1] })).caseVrNews('Case')
      );
      const result = (await Promise.all(all)).flat();
      result.forEach(el => {
        el.MainTitle = el.name.replace(/( |[|])/g, '');
        el.date = el.time.replace(/(年|月|日)/g, '/');
        this.caseModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      });
      console.info(`case: ${result.length}`);
      for (const iterator of result) {
        const el = (
          await this.Crawler.loadUrl(iterator.link, {
            title: iterator.text,
            parent: iterator.MainTitle.replace(/( |\[\])/g, ''),
          })
        ).caseVrNewsList(iterator.title);
        this.caseListModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      }
      console.timeEnd('case');
    }

    {
      console.time('news');
      // news

      const news: string[][] = [
        ['/news/node_49.shtml'],
        ['/news/node_48.shtml'],
      ];

      // 企业新闻
      for (let index = 2; index < _xw; index++) {
        news.push([`/news/node_49_${index}.shtml`]);
      }

      // 产品新闻
      for (let index = 2; index < 12; index++) {
        news.push([`/news/node_48_${index}.shtml`]);
      }

      // 行业新闻
      for (let index = 2; index < 235; index++) {
        news.push([`/news/node_47_${index}.shtml`]);
      }

      const all = news.map(async el =>
        (
          await this.Crawler.loadUrl(el[0], {
            title: 'news_list',
            parent: 'home',
          })
        ).caseVrNews('News')
      );
      const result = (await Promise.all(all)).flat();
      result.forEach(el => {
        el.MainTitle = el.name.replace(/( |[|])/g, '');
        el.date = el.time.replace(/(年|月|日)/g, '/');
        this.newsModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      });
      console.info(`case: ${result.length}`);

      for (const iterator of result) {
        const el = (
          await this.Crawler.loadUrl(iterator.link, {
            title: iterator.text,
            parent: iterator.MainTitle.replace(/( |\[\])/g, ''),
          })
        ).caseVrNewsList(iterator.title);
        this.newListModel
          .updateOne(
            { title: el.title },
            { $set: { ...(el as any) } },
            { upsert: true }
          )
          .exec();
        this.routeModel
          .updateOne({ title: el.title }, { $set: { rout: el.link } })
          .exec();
      }
      console.timeEnd('news');
    }

    return { time: Date.now() - now }; //{ productData, supports }
  }

  // -----------------------

  /**
   * 以下是代理商网站专用的api
   *
   */

  /**
   * 获取代理商关于信息
   * @param site
   * @param type
   * @returns
   */
  getAboutType(name: string, type: string) {
    return this.aboutModel
      .findOne({ webSite: name, type }, { content: 1 })
      .lean();
  }

  /**
   * 获取所有路由
   * @returns
   */
  getRout() {
    return this.routeModel.find({}).lean();
  }

  /**
   * 获取所有vr列表
   * @returns
   */
  getVrs() {
    return this.vrModel.find({}, this.pick).lean();
  }

  /**
   * 获取vr页面
   * @param link
   * @returns
   */
  getVr(link: string) {
    return this.vrModel.findOne({ link }, this.pick).lean();
  }

  /**
   * 获取所有经销商详细信息
   * @returns
   */
  getBuysAll() {
    return this.buyModel.find({}, this.pick).lean();
  }

  /**
   * 获取指定的经销商信息
   * @param link
   * @returns
   */
  getBuyListLink(link: string) {
    return this.buyListModel.find({ link }, this.pick).lean();
  }

  /**
   * 获取所有案例列表
   * @param company
   */
  async getCaseLists(company: string) {
    const data = await this.caseModel
      .find({ company }, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
      .lean();
    if (data.length > 0) {
      return data;
    } else {
      return await this.caseModel
        .find({}, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
        .lean();
    }
  }

  /**
   * 获取指定类型案例列表
   * @param company
   */
  async getCaseListsType(company: string, type: string) {
    const data = await this.caseModel
      .find({ company }, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
      .lean();
    if (data.length > 0) {
      return data.filter(el => el.MainTitle === type);
    } else {
      return await this.caseModel.find(
        { MainTitle: type },
        { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 }
      );
    }
  }

  /**
   * 获取指定案例
   * @param link
   * @returns
   */
  getCaselist(link: string) {
    return this.caseListModel.findOne({ link }, this.pick).lean();
  }

  /**
   * 获取所有新闻列表
   * @param company
   */
  async getNewsLists(company: string) {
    const data = await this.newsModel
      .find({ company }, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
      .lean();
    if (data.length > 0) {
      return data;
    } else {
      return await this.newsModel
        .find({}, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
        .lean();
    }
  }

  /**
   * 获取指定类型新闻列表
   * @param company
   */
  async getNewsListsType(company: string, type: string) {
    const data = await this.newsModel
      .find({ company }, { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 })
      .lean();
    if (data.length > 0) {
      return data.filter(el => el.MainTitle === type);
    } else {
      return await this.newsModel
        .find(
          { MainTitle: type },
          { text: 1, img: 1, name: 1, time: 1, link: 1, _id: 0 }
        )
        .lean();
    }
  }

  /**
   * 获取指定新闻
   * @param link
   * @returns
   */
  getNewslist(link: string) {
    return this.newListModel.findOne({ link }, this.pick).lean();
  }

  /**
   * 获取指定产品列表
   * @param type
   * @returns
   */
  getProductsType(type: string) {
    return this.productModel.find({ MainTitle: type }, this.pick).lean();
  }

  /**
   * 查询匹配产品信息
   * @param str 通配符
   * @returns
   */
  getProductsReg(str: string) {
    const regstr = eval('/' + str + '/i');
    return this.productModel
      .find({ $or: [{ Pagekeywords: regstr }, { title: regstr }] }, this.pick)
      .lean();
  }

  /**
   * 获取指定产品信息
   * @param link
   * @returns
   */
  getProductList(link: string) {
    return this.productListModel.findOne({ link }, this.pick).lean();
  }

  /**
   * 获取侧边栏
   * @param type
   * @returns
   */
  getPagesType(type: string) {
    return this.pageModel.find({ MainTitle: type }, this.pick).lean();
  }

  /**
   * 获取下载支持
   * @param type
   * @returns
   */
  getSupportType(type: string) {
    // const obj = Object.assign(this.pick,{MainTitle: 1})
    return this.supportModel.find({ MainParent: type }).lean();
  }

  /**
   * 获取教程支持
   * @param type
   * @returns
   */
  getSupportListsType(type: string) {
    return this.supportListModel.find({ MainUrl: type }, this.pick).lean();
  }

  /**
   * 获取
   * @returns
   */
  getSupportLists() {
    return this.supportListModel.find({}, this.pick).lean();
  }

  /**
   * 获取支持单例
   * @param link
   * @returns
   */
  getSupportList(link: string) {
    return this.supportListModel.findOne({ link }, this.pick).lean();
  }

  /**
   * 获取支持单例
   * @param link
   * @returns
   */
  getSupport(link: string) {
    return this.supportModel.findOne({ link }, this.pick).lean();
  }
}
