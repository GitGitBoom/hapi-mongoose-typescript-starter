import * as Package from '../../package.json';
import Hapi from '@hapi/hapi';
import routes from 'routes/index.route';
import pick from 'lodash/pick';
import {
  debug, isDevelopment, address, host, port, publicDir,
} from './vars';

// Midlewares
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import * as Auth from './plugins/auth.plugin';
import * as Logging from './plugins/logs.plugin';

/**
 * Hapi Validation 'failAction'
 * Respond with detailed validation errors during dev mode
 */
function handleJOIError(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
  err: Error,
) {
  /* istanbul ignore next tests are only run in devleopment  */
  const response = isDevelopment
    ? {...err, message: err.message}
    : pick(err, ['message', 'path', 'label']);

  return h.response(response)
    .code(400)
    .takeover();
}


/**
 * Swagger configuration
 */
const swaggerOptions: HapiSwagger.RegisterOptions = {
  info: {
    title: 'Test API Documentation',
    version: Package.version,
  },
  grouping: 'tags',
};


/**
 * Hapi Server Base Configuration
 */ 
export const server: Hapi.Server = Hapi.server({
  port,
  host,
  address,
  debug: debug ? {request: ['error']} : false,
  routes: {
    files: {
      relativeTo: publicDir,
    },
    cors: false,
    cache: {
      expiresIn: 60 * 60 * 1000,
      privacy: 'private',
    },
    auth: {
      strategy: 'jwt',
      scope: ['user', 'admin'],
      mode: 'required', // required | optional | try
    },
    validate: {
      failAction: handleJOIError,
    },
  },
});


/**
 * Server initiation
 * - Does not include port listening for tests
 */ 
export const init = async (): Promise<Hapi.Server> => {
  
  /**
   * Base plugins
   */
  await server.register([
    {plugin: Auth},
    {plugin: Logging},
    {plugin: Inert},
  ]);

  /**
   * Add Swagger Docs when in dev mode
   */
  /* istanbul ignore else */
  if (isDevelopment) {
    await server.register([
      {plugin: Vision},
      {
        plugin: HapiSwagger,
        options: swaggerOptions,
      },
    ]);
  }
  
  /**
   * Base routes
   */
  server.route(routes);
  
  await server.initialize();
  return server;
}


/**
 * Server start
 * Binds ports and accepts connections
 */ 
export const start = async (): Promise<Hapi.Server> => {
  await init();
  await server.start();
  return server;
};