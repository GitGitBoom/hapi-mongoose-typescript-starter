import Joi from 'joi';

/**
 * Password validation
 */
const Password = Joi.string().required()
  .label('Password')
  .ruleset
  .min(8)
  .max(256)
  .pattern(/[!#$%]+/)
  .rule({message: 'Password\'s must be at least 8 chars and contain a special character (!,#,$,%).'});


/**
 * Login endpoint
 */
export const login = {
  payload: Joi.object().keys({
    displayName: Joi.string()
      .label('Username')
      .ruleset
      .pattern(/^[a-z0-9 ]+$/i)
      .min(4).max(16)
      .rule({message: 'Username is invalid.'}),
    email: Joi.string()
      .max(128)
      .ruleset
      .email()
      .rule({message: 'Please use a valid email.'}),
    password: Joi.string().min(1).max(256),
    refreshToken: Joi.string().min(1).max(1024),
  })
    .xor('displayName', 'email')
    .xor('password', 'refreshToken')
    .messages({
      'object.missing': 'Email and password required.',
    }),
};


/**
 * User register endpoint
 */
export const register = {
  payload: Joi.object().keys({
    email: Joi.string().required()
      .max(128)
      .ruleset
      .email()
      .rule({message: 'Please use a valid email.'}),

    displayName: Joi.string().required()
      .label('Username')
      .ruleset
      .pattern(/^[a-z0-9 ]+$/i)
      .rule({message: 'Username\'s may only contain letters, numbers, and spaces.'})
      .ruleset
      .pattern(/^(\S+ ?)+$/) // Only allow single spaces between words
      .rule({message: 'Invalid username spacing.'})
      .ruleset
      .min(4).max(16)
      .rule({message: 'Username\'s must be between 4 - 16 characters.'}),

    password: Password,

    password2: Joi.string().required()
      .label('Password repeat')
      .valid(Joi.ref('password'))
      .messages({
        'any.only': 'Passwords do not match',
      }),
  }),
};


/**
 * Request reset password link email endpoint
 */
export const requestResetPassword = {
  payload: Joi.object().keys({
    email: Joi.string().required()
      .max(128)
      .ruleset
      .email()
      .rule({message: 'Please use a valid email.'}),
  }),
};


/**
 * Reset password endpoint
 */
export const resetPassword = {
  payload: Joi.object().keys({
    token: Joi.string().required()
      .ruleset
      .length(104)
      .hex()
      .rule({message: 'Invalid reset token.'}),

    password: Password,

    password2: Joi.string().required()
      .label('Password repeat')
      .valid(Joi.ref('password'))
      .messages({
        'any.only': 'Passwords do not match',
      })
      .strip(),
  }),
};
