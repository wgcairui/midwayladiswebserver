import { ConnectOptions } from "mongoose";


export const mongoose = {
  uri: `mongodb://${process.env.NODE_Docker === 'docker' ? 'mongo' : '127.0.0.1'
    }:27017/ladis`,
  options: {
    dbName: 'ladis',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    /* useCreateIndex: true, */

  } as ConnectOptions
};

export const cache = {
  store: 'memory',
  options: {
    max: 1000,
    ttl: 6000,
  },
};


export const cors = {
  // 设置 Access-Control-Allow-Origin 的值，【默认值】会获取请求头上的 origin
  // 也可以配置为一个回调方法，传入的参数为 request，需要返回 origin 值
  // 例如：http://test.midwayjs.org
  // 如果设置了 credentials，则 origin 不能设置为 *
  origin: '*',
}