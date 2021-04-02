import type {Connection, Error} from "mongoose";
import mongoose from "mongoose";
import Bluebird from 'bluebird';
import logger from './logger';
import {debug, mongoUri} from './vars';

// set mongoose Promise to Bluebird
mongoose.Promise = Bluebird;

// Exit application on error
/* istanbul ignore next exiting process will abort tests */
mongoose.connection.on('error', (error: Error) => {
  logger.error(`MongoDB connection error: ${error}`);
  process.exit(1);
});

/* istanbul ignore next */
if (debug) {
  mongoose.set('debug', true);
}

/**
 * Connect to mongo db using ENV vars
 * @returns {Promise<Connection>} connection  Mongoose connection object
 */
export const connect = async (): Promise<Connection> => {
  /* istanbul ignore next */
  if (debug) {
    // eslint-disable-next-line no-console
    console.log('Connecting to mongo at ', mongoUri);
  }

  await mongoose.connect(
    mongoUri,
    {
      keepAlive: true,
      useNewUrlParser: true,
    },
  );
  
  return mongoose.connection;
};