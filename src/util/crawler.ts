import { Init, Provide } from '@midwayjs/decorator';
import { CheerioAPI, load } from 'cheerio';
import axios from 'axios';
import {
  caseList,
  cases,
  DbTables,
  GMpack,
  pageLink,
  product,
  productList,
  support,
  supportAsid,
  supportList,
  supportProblem,
} from '../../types/typeing';

/**
 * 爬虫脚本
 * 爬取ladis网站旧的页面内容
 */
@Provide()
export class Crawler {
  host: string;
  $!: CheerioAPI;
  data: GMpack;

  @Init()
  init() {
    this.host = 'http://www.ladis.com.cn';
    this.data = {
      PageTitle: '',
      Pagekeywords: '',
      Pagedescription: '',
      MainUrl: '',
      MainTitle: '',
      date: new Date(),
      MainParent: '',
      href: '',
      link: '',
    };
  }

  async loadUrl(url: string, opt?: { title: string; parent?: string }) {
    const data = await axios
      .get('http://www.ladis.com.cn' + url, { timeout: 10000 })
      .then(res => {
        return {
          code: 200,
          data: res.data,
        };
      })
      .catch(() => ({ code: 0, data: '' }));
    this.$ = load(data.data);
    this.data.MainUrl = url;
    this.data.link = url;
    this.data.MainTitle = opt.title;
    this.data.MainParent = opt.parent;
    this.meta();
    return this;
  }

  /**
   * 通用获取页面标题，key，des
   */
  meta() {
    this.data.PageTitle = this.$('title').text().split('-')[0].trim();
    this.$('meta').each((i, el) => {
      if (el.attribs.name === 'keywords')
        this.data.Pagekeywords = el.attribs.content;
      if (el.attribs.name === 'description')
        this.data.Pagedescription = el.attribs.content;
    });
  }

  /**
   *
   * @returns
   */
  head() {
    const result: pageLink[] = [];
    this.$('#pc_nav .new-down').each((i, val) => {
      //遍历一级li
      const prev = this.$(val).prev();
      const title = prev.text();
      const href = `/${prev.attr('href')?.split('/')[1]}/${title}`;
      const link = prev.attr('href') as string;
      // 保存结果
      const args: pageLink[] = [];
      prev.find('a').map(function (ii: any, v2: any) {
        //遍历二级li
        const h = this.$(v2);
        const title = h.text();
        const href = `/${h.attr('href')?.split('/')[1]}/${title}`;
        const link = h.attr('href') as string;
        args.push({
          ...this.data,
          title,
          href,
          link,
        });
      });
      const data: pageLink = {
        ...this.data,
        title,
        href,
        link,
        args,
      };
      result.push(data);
    });
    return result;
  }

  /**
   * 设备类型
   * @returns
   */
  products() {
    const result: product[] = [];
    this.$('#scroller .list li').each((i, val) => {
      const j = this.$(val);
      const data: product = {
        ...this.data,
        title: j.find('h3').text(),
        href: `/products/list/${j.find('h3').text()}`,
        img: j.find('img').attr('src') as string,
        link: j.find('a').attr('href') as string,
      };
      result.push(data);
    });
    return result;
  }

  /**
   * 每个设备的详情页面
   * @param title
   * @returns
   */
  productList(title: string) {
    const result: productList[] = [];
    //抓取图片
    const img: string[] = [];
    this.$('.swiper-wrapper')
      .first()
      .find('img')
      .each((i, val) => {
        img.push(this.$(val).attr('src') as string);
      });
    const ImgArr = this.$('.functionItems .productUtilImg img');
    if (ImgArr) {
      ImgArr.each((i, val) => {
        img.push(this.$(val).attr('src') as string);
      });
    } else {
      img.push(this.$('.swiper-slide img')?.first()?.attr('src') as string);
    }

    const datas: productList = {
      ...this.data,
      title,
      img: Array.from(new Set(img)), // 图片去重
      head: this.$('.printDisplay_para').html(),
      body: this.$('.responseWidth').html() || this.$('.new_list_outer').html(),
    };
    result.push(datas);
    return result;
  }

  /**
   * 抓取support页面常见问题
   */
  support_problem() {
    const data: supportAsid[] = [];
    this.$('.relate a').each((i, val) => {
      const title = this.$(val).text().split('、')[1].trim();
      data.push({
        ...this.data,
        title,
        link: this.$(val).attr('href') as string,
        href: `problem/${title}`,
      });
    });
    return data;
  }

  /**
   * 抓取support页面软件下载
   */
  async support_down() {
    const data: support[] = [];
    const e = [] as { title: string; href: string }[];
    this.$('.tabContBox li').each((i, val) => {
      const j = this.$(val);
      const title = j.find('span').first().text();
      const href = j.find('a').attr('href') as string;
      e.push({ title, href });
    });
    for (const i of e) {
      if (i.href.includes('.shtml')) {
        const d = await this.loadUrl(i.href, {
          title: this.data.MainTitle,
          parent: this.data.MainParent,
        });
        const info: support = {
          ...d.data,
          link: i.href,
          type: 'soft',
          title: d.$('#Table .productName').text().replace(/\n/g, ''),
          date: d.$('#Table .publishDate').text().replace(/\n/g, ''),
          platform: d.$('#Table .platform').text().replace(/\n/g, ''),
          language: d.$('#Table .language').text().replace(/\n/g, ''),
          size: d.$('#Table .fileSize').text().replace(/\n/g, ''),
          version: d.$('#Table .version').first().text().replace(/\n/g, ''),
          updateReason: d.$('#Table .updateReason').text().replace(/\n/g, ''),
          down: d.$('#Table .agreeLoad').attr('href') as string,
        };
        data.push(info);
      } else {
        const down: support = { ...this.data, type: 'pdf', ...i };
        data.push(down);
      }
    }
    return data;
  }

  /**
   * support 常见问题，视频教程 asid
   */
  support_problem_asid() {
    const data: supportProblem[] = [];
    this.$('.left-search-list .search-list-item').each((i, val) => {
      const j = this.$(val);
      const title = j.find('.lmmc a').text();
      const link = j.find('.lmmc a').attr('href') as string;
      const href = `/support/${title}`;
      const child: supportProblem[] = [];
      const d: supportProblem = {
        ...this.data,
        title,
        link,
        href,
      };
      j.find('.list-sub-item a').each((i, val) => {
        child.push({
          ...this.data,
          MainParent: d.MainTitle,
          MainTitle: d.title,
          title: this.$(val).text(),
          link: this.$(val).attr('href') as string,
          href: `/support/${this.$(val).text()}`,
        });
      });
      d.child = child;
      data.push(d);
    });
    return data;
  }

  /**
   * support 常见问题，视频教程 main
   */
  async support_problem_args(title: string) {
    const supportListResult: supportList[] = [];
    this.$('.r-search-wrap li a').each((i, val) => {
      const j = this.$(val);
      const data: supportList = {
        ...this.data,
        title: j.text(),
        link: j.attr('href') as string,
        href: `/support/problem/${title}`,
      };
      supportListResult.push(data);
    });
    for (const list of supportListResult) {
      if (list.link.includes('.shtml')) {
        const $ = (await this.loadUrl(list.link)).$;
        list.movie = $('iframe').attr('src');
        if (!list.movie) {
          // 没有
          list.html = $('.new_list_outer').html();
        }
      }
    }
    return supportListResult;
  }

  /**
   * 获取新闻,案例,vr
   * @param table 属于那个类型
   * @returns
   */
  caseVrNews(table: DbTables) {
    const list = this.$('#listPc').find('.new_list');
    const map: cases[] = [];
    list.each((i, val) => {
      const img = this.$(val).find('.new_list_img img').attr('src') as string;

      const name = this.$(val)
        .find('.new_list_con .typeAndTime .type_name')
        .text();
      const time = this.$(val)
        .find('.new_list_con .typeAndTime .type_time')
        .text();
      const text = this.$(val).find('.new_list_con .new_title_list').text();
      const link = this.$(val)
        .find('.new_list_con .new_details a')
        .attr('href') as string;
      const linkText = this.$(val).find('.new_list_con .new_details a').text();
      const href = `/${table}/${text}`;
      map.push({
        ...this.data,
        title: text,
        img,
        name,
        time,
        text,
        link,
        href,
        linkText,
      });
    });
    return map;
  }

  caseVrNewsList(title: string) {
    const data: caseList = {
      ...this.data,
      title,
      content: this.$('.new_list_outer').html(),
    };
    return data;
  }
}
