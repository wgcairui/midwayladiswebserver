import { prop, Prop, Ref } from "@typegoose/typegoose";
/**
 * 文档统一格式
 */
class DocmentBody {
    /**
     * 页面标题
     */
    @Prop({ trim: true })
    public PageTitle: string

    /**
     * 页面关键字
     */
    @Prop({ trim: true })
    public Pagekeywords: string

    /**
     * 页面描述
     */
    @Prop({ trim: true })
    public Pagedescription: string

    /**
     * 上级链接
     */
    @Prop({ trim: true })
    public MainUrl: string

    /**
     * 父名称
     */
    @Prop({ trim: true })
    public MainTitle: string

    /**
     * 父目录
     */
    @Prop({ trim: true })
    public MainParent: string

    /**
     * 文档标题
     */
    @Prop({ trim: true })
    public title?: string

    /**
     * 更新时间
     */
    @Prop()
    public date: string

    /**
     * 文档名称
     */
    @Prop()
    public table: string


    @Prop()
    public href: string

    /**
     * 文档url链接
     */
    @Prop()
    public link: string
}

/**
 * 列表文档统一连接
 */
class Links extends DocmentBody {
    @Prop()
    public img: string

    @Prop()
    public name: string

    @Prop()
    public time: string

    @Prop()
    public text: string

    @Prop()
    public link: string

    @Prop()
    public linkText: string
}

/**
 * 产品类型
 */
export class Product extends DocmentBody {
    /**
     * 展示图片
     */
    @Prop()
    public img: string
}

/**
 * 产品详情
 */
export class Product_list extends DocmentBody {
    @prop()
    public head: string

    @prop()
    public body: string

    @prop({ type: () => [String] })
    public img: string[]
}

/**
 * 服务支持类型
 */
export class Support extends DocmentBody {
    @Prop()
    public language: string

    @Prop()
    public type: string

    @Prop()
    public platform: string

    @Prop()
    public size: string

    @Prop()
    public version: string

    @Prop()
    public updateReason: string

    @Prop()
    public down: string
}

export class Support_list extends DocmentBody {
    @Prop()
    public movie: string

    @Prop()
    public html: string

    @Prop()
    public parentsUntil: string

    @Prop()
    public parent: string

    @Prop()
    public data: string
}

/**
 * 经销商列表
 */
export class Buy extends DocmentBody {
    @Prop()
    public alt: string

    @prop()
    public shape: string

    @Prop()
    public coords: string
}

/**
 * 经销商详细信息
 */
export class Buy_list extends DocmentBody {
    @Prop()
    public parentsUntil: string

    @Prop()
    public parent: string

    @Prop()
    public content: string
}

/**
 * 360全景
 */
export class VR extends Links {
}

/**
 * 案例
 */
export class Case extends Links {
    @Prop()
    public company?: string
}

/**
 *案例详情
 */
export class Case_list extends DocmentBody {
    @Prop()
    public content: string

    @Prop()
    public company?: string
}

/**
 * 新闻
 */
export class New extends Links {
    @Prop()
    public company?: string
}

/**
 *新闻详情
 */
export class News_list extends DocmentBody {
    @Prop()
    public content: string

    @Prop()
    public company?: string
}



/**
 * 网站相关
 */
export class About {
    @Prop()
    public webSite: string

    @Prop()
    public type: string

    @Prop()
    public content: string
}

/**
 * 页面相关
 */
export class Page extends DocmentBody {
    /* @Prop({type:()=>"Mixed"})
    args */
    @Prop({ ref: () => DocmentBody })
    public child: Ref<DocmentBody>[]
}

/**
 * 路由链接
 */
export class Router {
    @Prop()
    public title: string

    @Prop()
    public rout: string

    @Prop()
    public href: string
}

