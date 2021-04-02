import {MongoMemoryServer} from 'mongodb-memory-server';

declare var global: {
  mongod: MongoMemoryServer
};

export default async function beforeTests() {
  process.env.DEBUG = 'false';

  /**
   * If a local MongoDB uri has not been 
   * specified, use MongoMemoryServer
   */
  if (!process.env.MONGO_URI_TESTS) {
    // Create and save MongoServer instance to Jest's globals
    let mongod = global.mongod = new MongoMemoryServer({
      binary: {
        version: '4.4.3'
      }
    });
    process.env.MONGO_URI = await mongod.getUri();
  }
  else {
    process.env.MONGO_URI = process.env.MONGO_URI_TESTS;
  }
};