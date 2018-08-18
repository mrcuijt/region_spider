// https://github.com/nswbmw/koa-mongo/blob/master/index.js
// https://github.com/clearbladeplatform/generic_pool
// https://github.com/mongodb/node-mongodb-native
const genericPool = require("generic-pool");
const MongoDB = require('mongodb');
const MongoClient = MongoDB.MongoClient;

const options = {
  host: 'localhost',
  port: 27017,
  db: 'spider',
  max: 100, // 连接池最大连接数
  min: 1    // 连接池最小连接数
};

const mongoUrl = "mongodb://"+options.host+":"+options.port+"/"+options.db;

const mongoPool = genericPool.createPool({
    create: () => MongoClient.connect(mongoUrl),
    destroy: client => client.close()
}, options);

// 将连接池模块导出
module.exports=mongoPool;
