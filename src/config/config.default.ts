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
