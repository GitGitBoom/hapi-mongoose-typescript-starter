import * as Hapi from './config/hapi';
import {isDevelopment} from './config/vars';
import * as mongooseConfig from './config/mongoose';
import logger from './config/logger';

(async () => {
  await mongooseConfig.connect();

  // Start the server
  Hapi.start().then((server) => {
    logger.info(
      `Server started at ${server.info.uri}. ${isDevelopment ? 'Development' : 'Production'} mode.`,
    );
  }).catch((err) => {
    logger.error(`Error starting hapi server. ${String(err)}`);
  });
})();