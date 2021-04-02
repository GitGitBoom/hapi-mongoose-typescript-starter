import * as authController from 'controllers/auth.controller';
import * as validations from 'validations/auth.validation';
import type {ServerRoute} from '@hapi/hapi';

/**
* @api {post} v1/auth/register  User registration
* @apiDescription request user registration
* @apiVersion 1.0.0
* @apiName register
* @apiGroup Auth
* @apiPermission none
*
* @apiParam (payload)  {String}  displayName
* @apiParam (payload)  {String}  email
* @apiParam (payload)  {String}  password
* @apiParam (payload)  {String}  password2
*
* @apiSuccess {Object}  AuthenticatedUser  User data and token
*
* @apiError (Bad Request 400)  Invalid     Validation failed
* @apiError (Conflict 409)     Conflict    Username or email exists
*/
export const RegisterUser: ServerRoute = {
  method: 'POST',
  path: '/v1/auth/register',
  handler: authController.register,
  options: {
    validate: validations.register,
    auth: false,
    tags: ['api', 'auth'],
  },
};


/**
* @api {post} v1/auth/me Get current user info
* @apiDescription Get the current users public data
* @apiVersion 1.0.0
* @apiName currentuser
* @apiGroup Auth
* @apiPermission user
*
* @apiSuccess {PublicUser} user
*
* @apiError (Unauthorized 401)  Unauthorized  Incorrect credentials
*/
export const CurrentUserInfo: ServerRoute = {
  method: 'GET',
  path: '/v1/auth/me',
  handler: authController.currentUser,
  options: {
    auth: {
      scope: ['user'],
    },
    tags: ['api', 'auth'],
  },
};


/**
* @api {post} v1/auth/login  User login
* @apiDescription Request user signin with either email or displayName, password or refreshToken
* @apiVersion 1.0.0
* @apiName Login
* @apiGroup Auth
* @apiPermission none
*
* @apiParam (payload)  {String}  [displayName]
* @apiParam (payload)  {String}  [email]
* @apiParam (payload)  {String}  [password]
* @apiParam (payload)  {String}  [refreshToken]
*
* @apiSuccess {AuthedUser}  AuthenticatedUser     User data and token
*
* @apiError (Bad Request 400)   Invalid       Validation failed
* @apiError (Unauthorized 401)  Unauthorized  Incorrect credentials
*/
export const LoginUser: ServerRoute = {
  method: 'POST',
  path: '/v1/auth/login',
  handler: authController.login,
  options: {
    validate: validations.login,
    auth: false,
    tags: ['api', 'auth'],
  },
};


/**
* @api {post} v1/request-reset-password  Request password reset
* @apiDescription Request password reset link
* @apiVersion 1.0.0
* @apiName resetpasswordemail
* @apiGroup Auth
* @apiPermission none
*
* @apiParam (payload)  {String}  email
*
* @apiSuccess {Boolean} EmailSent
*
* @apiError (Bad Request 400)  Invalid       Validation failed
* @apiError (Bad Request 400)  InvalidEmail  Email doesn't exist
*/
export const RequestResetPassword: ServerRoute = {
  method: 'POST',
  path: '/v1/auth/request-reset-password',
  handler: authController.sendResetPasswordEmail,
  options: {
    validate: validations.requestResetPassword,
    auth: false,
    tags: ['api', 'auth'],
  },
};

  
/**
* @api {post} v1/reset-password  Password reset
* @apiDescription Reset a users password using a token
* @apiVersion 1.0.0
* @apiName resetpassword
* @apiGroup Auth
* @apiPermission none
*
* @apiParam (payload)  {String}  token
* @apiParam (payload)  {String}  password
* @apiParam (payload)  {String}  password2
*
* @apiSuccess {Boolean} Success
*
* @apiError (Bad Request 400)  Invalid  Validation failed
* @apiError (Bad Request 410)  Gone     Token expired
*/
export const ResetPassword: ServerRoute = {
  method: 'POST',
  path: '/v1/auth/reset-password',
  handler: authController.resetPassword,
  options: {
    validate: validations.resetPassword,
    auth: false,
    tags: ['api', 'auth'],
  },
};