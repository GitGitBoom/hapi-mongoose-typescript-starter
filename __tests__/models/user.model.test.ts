/**
 * User Unit Tests 
 */
import User from 'models/user.model';

describe('User Model Unit Tests', function() {
  describe('Static methods', () => {
    test('should successfully get User role types', () => {
      let roles = User.getRoles();
      expect(roles).toBeInstanceOf(Array);
    });
  });
});