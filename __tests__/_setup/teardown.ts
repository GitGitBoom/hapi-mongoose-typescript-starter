import {MongoMemoryServer} from 'mongodb-memory-server';

declare var global: {
  mongod: MongoMemoryServer
};

export default async function afterTests() {
  global.mongod?.stop();
};