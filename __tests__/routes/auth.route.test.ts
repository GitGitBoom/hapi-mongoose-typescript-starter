/**
 * auth.route integration tests 
 */

 jest.mock('nodemailer');
 // import nodemailer from 'nodemailer';
 const nodemailer = require('nodemailer');

import * as Mongoose from 'config/mongoose';
import * as Hapi from 'config/hapi';
import User from 'models/user.model';
import ResetToken from 'models/reset-token.model';
import httpStatus from 'http-status';

const authTempUser = {
  displayName: 'Auth Test User',
  email: 'auth-test-user@example.com',
  password: 'sample-password!',
  password2: 'sample-password!',
};


describe('routes/auth.route.js', function() {
  let server;
  let mongooseConnection;

  
  // ({
  //   sendMail: async (options) => ({success: true})
  // })

  beforeAll(async () => {
    server = await Hapi.init();
    mongooseConnection = await Mongoose.connect();
    // User needs indexes inititlized to ensure duplicate errors
    await User.ensureIndexes();
  });

  afterAll(async () => {
    await server.stop();
    await mongooseConnection.close();
  });

  /**
   * Registration
   */
  describe('POST /v1/auth/register', () => {
    const register = async payload => server.inject({
      method: 'POST',
      url: `/v1/auth/register`,
      payload,
    });


    test('should successfully register user', async () => {
      const res = await register(authTempUser);
      expect(res.statusCode).toEqual(201);
    });


    test('should fail due to existing user name', async () => {
      const res = await register({
        ...authTempUser,
        email: 'newer-sample-user@example.com', // Use diff email
      });

      expect(res.statusCode).toEqual(httpStatus.CONFLICT);
      expect(res.result.message).toEqual('Username is already taken.');
    });


    test('should fail due to existing email', async () => {
      const res = await register({
        ...authTempUser,
        displayName: 'Valid User Name', // Use diff username
      });
      expect(res.statusCode).toEqual(httpStatus.CONFLICT);
      expect(res.result.message).toEqual('Email is already registered.');
    });

    test('should fail due to a missing field error', async () => {
      const res = await register({
        ...authTempUser,
        email: '',
      });
      
      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });


    test('should fail due to unknown error', async () => {
      // Use a spy to temporarily replace a method's return value
      const spy = await jest.spyOn(User, 'create').mockImplementation(
        () => Promise.reject(new Error('An unknown/unexpected error.')),
      );
      const res = await register(authTempUser);
      expect(res.statusCode).toEqual(httpStatus.INTERNAL_SERVER_ERROR);
      spy.mockRestore();
    });
  });


  /**
   * Login/Signin
   */
  describe('POST /v1/auth/login', () => {
    let authTokenData;
    const signin = async payload => server.inject({
      method: 'POST',
      url: `/v1/auth/login`,
      payload,
    });


    test('should successfully log in with username', async () => {
      const res = await signin({
        displayName: authTempUser.displayName,
        password: authTempUser.password,
      });
      expect(res.statusCode).toEqual(httpStatus.OK);
      
      // Stash token data to use in other tests
      authTokenData = res.result;
    });


    test('should successfully log in with email', async () => {
      const res = await signin({
        email: authTempUser.email,
        password: authTempUser.password,
      });
      expect(res.statusCode).toEqual(httpStatus.OK);
    });

    
    test('should successfully log in with refresh token', async () => {
      const res = await signin({
        email: authTempUser.email,
        refreshToken: authTokenData.refreshToken,
      });
      expect(res.statusCode).toEqual(httpStatus.OK);
    });


    test('should successfully get the current user\'s data', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/v1/auth/me`,
        headers: {
          Authorization: `Bearer ${authTokenData.token}`
        }
      });
      expect(res.statusCode).toEqual(httpStatus.OK);
    });
    
    
    test('should fail to get the current user\'s data due to invalid token', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/v1/auth/me`,
        headers: {
          Authorization: `Bearer ${authTokenData.token.repeat(2)}`
        }
      });
      expect(res.statusCode).toEqual(httpStatus.UNAUTHORIZED);
    });


    test('should fail due to invalid user name', async () => {
      const res = await signin({
        displayName: 'Invalid Username',
        password: 'sample-password',
      });
      expect(res.statusCode).toEqual(httpStatus.UNAUTHORIZED);
    });


    test('should fail due to invalid user email', async () => {
      const res = await signin({
        email: 'invalid-email@example.com',
        password: 'sample-password',
      });
      expect(res.statusCode).toEqual(httpStatus.UNAUTHORIZED);
    });


    test('should fail due to invalid password', async () => {
      const res = await signin({
        email: authTempUser.email,
        password: 'wrong-password',
      });
      expect(res.statusCode).toEqual(httpStatus.UNAUTHORIZED);
    });


    test('should fail due to invalid refresh token', async () => {
      const res = await signin({
        email: authTempUser.email,
        refreshToken: authTokenData.refreshToken.repeat(2),
      });
      expect(res.statusCode).toEqual(httpStatus.UNAUTHORIZED);
    });
  });
  
  /**
   * Request reset password email
   * Note: User created/registered in previous test
   */
  describe('POST /v1/auth/request-reset-password', () => {
    const requestPassReset = payload => server.inject({
      method: 'POST',
      url: `/v1/auth/request-reset-password`,
      payload,
    });

    test('should successfully request an email', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: async () => true,
      });
      const res = await requestPassReset({
        email: authTempUser.email,
      });
      expect(res.statusCode).toEqual(httpStatus.OK); 
    });

    test('should fail due to mail server error', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: async () => {throw Error('Mail failed to send.')},
      });
      const res = await requestPassReset({
        email: authTempUser.email,
      });
      expect(res.statusCode).toEqual(httpStatus.INTERNAL_SERVER_ERROR); 
    });
    
    test('should fail due to an invalid email', async () => {
      const res = await requestPassReset({  
        email: 'invalid-user-email@example.com',
      });
      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
      expect(res.result.message).toEqual('Email not found.');
    });
  });


  /**
   * Reset password from token
   * Note: reset token issued for user in previous test
   */
  describe('POST /v1/auth/reset-password', () => {
    let resetToken;
    const resetPassword = payload => server.inject({
      method: 'POST',
      url: `/v1/auth/reset-password`,
      payload,
    });

    test('should fail due to invalid user no longer existing', async () => {
      const tempUser = await User.findOne({email: authTempUser.email});
      resetToken = await ResetToken.findOne({user: tempUser._id});

      // Use a spy to temporarily replace a method's return value
      const spy = jest.spyOn(User, 'findByResetToken').mockImplementation(
        () => Promise.resolve(null),
      );
      
      const res = await resetPassword({
        token: resetToken.token,
        password: 'replacement-pass!',
        password2: 'replacement-pass!',
      });

      expect(res.statusCode).toEqual(httpStatus.GONE);
      spy.mockRestore();
    });


    test('should successfully reset passsword', async () => {  
      const res = await resetPassword({
        token: resetToken.token,
        password: 'replacement-pass123!',
        password2: 'replacement-pass123!',
      });
      expect(res.statusCode).toEqual(httpStatus.OK); 
      expect(res.result.message).toEqual('Password successfully updated.');
    });


    // The reset token was removed when used in previous test
    test('should fail due to expired/removed token', async () => {
      const res = await resetPassword({
        token: resetToken.token,
        password: 'replacement-pass!',
        password2: 'replacement-pass!',
      });

      expect(res.statusCode).toEqual(httpStatus.GONE);
    });
  });

});