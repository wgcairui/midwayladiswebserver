import { ConnectOptions } from 'mongoose';

// Mongo host 解析顺序：
//   1. MONGO_HOST env（compose 切流量时显式注入，例如 'mongo6' / 'mongo'）
//   2. NODE_Docker === 'docker' 时默认连 compose 服务名 'mongo'（5.x 老实例）
//   3. 否则连本机 127.0.0.1（裸机 / 本地开发）
//
// 之所以改成读 env：2026-06 跟 midwayuartserver 一起把 db 从 mongo5 迁到 mongo6，
// 通过 MONGO_HOST 切流量，不需要再为每个 compose 服务改源码。
const mongoHost = process.env.MONGO_HOST
  || (process.env.NODE_Docker === 'docker' ? 'mongo' : '127.0.0.1');

export const mongoose = {
  uri: `mongodb://${mongoHost}:27017/ladis`,
  options: {
    dbName: 'ladis',
    /* useCreateIndex: true, */
  } as ConnectOptions,
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
};

// midway-logger 默认 enable file log，但要求 fileLogName；
// 项目里没声明 midway-logger，所以走默认配置会导致启动失败。
// 显式 disable file log（输出到 stdout，由 docker logs / deploy.sh logs 收集）。
// 如需文件日志，设置 fileLogName 即可（参考 @midwayjs/logger 文档）。
export const midwayLogger = {
  disableFile: true,
};
