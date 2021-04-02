/**
 * Root route file
 */
import type {ServerRoute} from '@hapi/hapi';
import * as AuthRoutes from './v1/auth.route';

/**
 * @api {post} /status  API Status
 * @apiDescription Check the apis atatus
 * @apiVersion 1.0.0
 * @apiName apistatus
 * @apiGroup Status
 * @apiPermission none
 *
 * @apiSuccess {String}  ok
 */
const StatusRoute: ServerRoute = {
  method: 'GET',
  path: '/status',
  handler: () => 'ok',
  options: {
    auth: false,
    tags: ['api'],
    description: 'Check API is ready.',
  },
};

export default [
  StatusRoute,
  ...Object.values(AuthRoutes),
];