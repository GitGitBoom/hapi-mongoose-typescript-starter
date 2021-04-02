/**
 * hapi integration tests 
 */
import * as Hapi from 'config/hapi';

describe('Hapi config', function() {
  describe('POST /v1/auth/register', () => {
    test('should successfully start server', async () => {
      let server = await Hapi.start();
      expect(server.info.started).toBeGreaterThan(0); 
      await server.stop();
    });
  });
});   