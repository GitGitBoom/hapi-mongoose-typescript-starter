import Hapi from '@hapi/hapi';
import {isDevelopment, isTesting} from 'config/vars';
import logger from 'config/logger';

/**
 * Handle Hapi server logging
 * @param {Server} server 
 */
export default function LoggerMiddleware(server: Hapi.Server): void {
  // Output response's in console during development
  /* istanbul ignore next - coverage tests are not run in debug */
  if (isDevelopment && !isTesting) {
    server.events.on('response', (response) => {
      // eslint-disable-next-line no-console
      console.log('-', response.method.toUpperCase(), response.raw.res.statusCode, response.route.path);
    });
  }

  // Log internal errors to winston
  server.events.on({name: 'request', channels: 'error'}, (
    request: Hapi.Request,
    event: Hapi.RequestEvent,
    tags,
  ) => {
    /* istanbul ignore else only non-boom errors are logged */
    if (tags.internal) {
      logger.error({
        message: String(event.error),
        path: request.route.path,
        method: request.route.method,
        user: request.user?.name ?? null,
      });
    }
  });
}
