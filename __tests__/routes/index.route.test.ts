/**
 * index.route integration tests 
 */
import * as Hapi from 'config/hapi';
import httpStatus from 'http-status';

describe('routes/auth.route.js', function() {
  let server;
  beforeAll(async () => {
    server = await Hapi.init();
  });

  afterAll(async () => {
    await server.stop();
  });

  /**
   * API Status
   */
  describe('POST /status', () => {
    const getStatus = async () => server.inject({
      method: 'GET',
      url: `/status`,
    });

    test('should successfully get API status', async () => {
      const res = await getStatus();
      expect(res.statusCode).toEqual(httpStatus.OK);
    });
  });
});
