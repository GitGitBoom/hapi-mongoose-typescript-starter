/**
 * Wrap and configure the HapiAuthJwt2 plugin
 */
import type Hapi from '@hapi/hapi';
import * as User from 'models/user.model';
import HapiAuthJwt2 from 'hapi-auth-jwt2';
import {jwtSecret} from 'config/vars';

/**
 * Add the 'User' document interface to 
 * Hapi's Request interface so that it can be 
 * assigned when the user is authorized
 */
declare module "@hapi/hapi" {
  export interface Request {
     user?: User.Document,
  }
}

/**
 * Once the JWT is successfully decrypted
 * Verify the user _id is valid and add the 
 * 'User' document to Hapi's Request object
 */
const validate = async function (
  decoded: User.JWTPayload,
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
): Promise<Hapi.AuthArtifacts> {
  const {sub} = decoded;
  const response = {
    isValid: false,
    errorMessage: 'User not found.',
    credentials: null,
  };

  // Asign the user to the request if it exists
  const user = await User.default.findOneAndUpdate(
    {_id: sub},
    {lastActive: new Date()},
    {timestamps: false, useFindAndModify: false},
  );

  /* istanbul ignore else - only would happen is user is deleted */
  if (user) {
    request.user = user;
    response.isValid = true;
    response.credentials = {
      id: user._id,
      email: user.email,
      scope: user.role,
    };
  }

  return response;
}; 


/**
 * Apply and configure the HapiAuthJwt2 plugin
 * @param {Object} server  hapi server
 * @return {void}
 */
export const register = async (
  server: Hapi.Server,
): Promise<void> => {
  await server.register(HapiAuthJwt2);

  server.auth.strategy('jwt', 'jwt', {
    key: jwtSecret,
    validate,
    verifyOptions: {algorithms: ['HS256']},
  });

  server.auth.default('jwt');
};

export const name = "Basic authorization";
export const version = '1.0.0';