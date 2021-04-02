import * as User from 'models/user.model';
import Boom from '@hapi/boom';
import httpStatus from 'http-status';
import type Hapi from '@hapi/hapi';
import {isDuplicateError, getDuplicateFields} from 'helpers/mongo-error';
import nodemailer from 'nodemailer';

interface LoginResponse extends User.AuthedUser {
  token: string;
  tokenExpires: Date;
  refreshToken: string;
  refreshTokenExpires: Date;
}

/**
* Returns a formated object with tokens
* @private
*/
async function generateUserTokenResponse(
  user: User.Document,
): Promise<LoginResponse> {
  const [token, refreshToken] = await Promise.all([
    user.token(),
    user.refreshToken(),
  ]);
  return {
    ...user.transformAuthorized(),
    token: token.token,
    tokenExpires: token.expiresUTC,
    refreshToken: refreshToken.token,
    refreshTokenExpires: refreshToken.expiresUTC,
  };
}


/**
 * Get the current user's public data
 * @public
 */
export const currentUser = async (
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
): Promise<User.PublicUser> => {
  const currentUser = request.user;
  return currentUser.transform();
};


/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
interface LoginRequest extends Hapi.Request {
  payload: {
    email: string;
    displayName: string;
    password: string;
    refreshToken: string;
  };
}
export const login = async (
  request: LoginRequest,
  h: Hapi.ResponseToolkit,
): Promise<LoginResponse> => {
  const user = await User.default.findAndCompare(request.payload);

  if (!user) {
    throw Boom.unauthorized('Incorrect password or email.');
  }

  return generateUserTokenResponse(user);
};


/**
 * Create a new user and generate an access token
 * @public
 */
interface RegisterRequest extends Hapi.Request {
  payload: {
    email: string;
    displayName: string;
    password: string;
    password2: string;
  };
}
export const register = async (
  request: RegisterRequest,
  h: Hapi.ResponseToolkit,
): Promise<Hapi.ResponseObject> => {
  try {
    const user = await User.default.create(request.payload);
    return h
      .response(await generateUserTokenResponse(user))
      .code(httpStatus.CREATED);
  } catch (error) {
    if (isDuplicateError(error)) {
      const fields = getDuplicateFields(error);
      if (fields.includes('email')) {
        throw Boom.conflict('Email is already registered.');
      }
      // The only other possible duplicate field is username
      throw Boom.conflict('Username is already taken.');
    }
    
    throw error;
  }
};


/**
 * Creates a password reset token and sends an email to the user
 * @public
 */
interface PasswordResetEmailRequest extends Hapi.Request {
  payload: {
    email: string;
  };
}
export const sendResetPasswordEmail = async (
  request: PasswordResetEmailRequest,
  h: Hapi.ResponseToolkit,
): Promise<Hapi.ResponseValue> => {
  const {email} = request.payload;
  const user = await User.default.findOne({email});
  if (!user) {
    throw Boom.badRequest('Email not found.');
  }

  // Create the reset token
  const token = await user.passwordResetToken();

  // Init a mail server
  const basicEmailServer = nodemailer.createTransport(process.env.EMAIL_SERVER);

  const result = await basicEmailServer.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Password reset token",
    html: `
      <p>Here is your password reset token. Hapi Starter does not include a reset form yet.</p>
      <p>${token.token}</p>
    `,
  }).catch(() => {
    throw Boom.internal('Failed to send reset email.')
  });

  return {message: 'Successfully sent password reset email.'};
};


/**
 * Creates a password reset token and sends an email to the user
 * @public
 */
interface ResetPasswordRequest extends Hapi.Request {
  payload: {
    token: string;
    password: string;
  };
}
export const resetPassword = async (
  request: ResetPasswordRequest,
  h: Hapi.ResponseToolkit,
): Promise<Hapi.ResponseValue> => {
  const {token, password} = request.payload;

  // Find user by token, also deletes token docs
  const user = await User.default.findByResetToken(token);

  // Set the new password, hashing is done via pre-save hook
  if (user) {
    user.password = password;
    await user.save();
    return {message: "Password successfully updated."};
  }
  else {
    throw Boom.resourceGone('Reset password token has expired.');
  }
};

