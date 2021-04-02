import mongoose from 'mongoose';
import pick from 'lodash/pick';
import omitBy from 'lodash/omitBy';
import kebabCase from 'lodash/kebabCase';
import jwt from 'jsonwebtoken';
import dayjsBase from 'dayjs';
import bcrypt from 'bcryptjs';
import {jwtSecret, jwtExpirationInterval} from 'config/vars';
import * as RefreshToken from './refresh-token.model';
import * as PasswordResetToken from './reset-token.model';
import dayjsUTC from 'dayjs/plugin/utc';
const dayjs = dayjsBase.extend(dayjsUTC);

/**
* User Roles
*/
enum Role {
  'user' = 'user',
  'admin' = 'admin',
}
const roles = ['user', 'admin'];

/**
 * Tranformed props
 */
const publicProperties = ['name', 'displayName', 'role', 'createdAt'] as const;
const authedProperties = [...publicProperties, 'updatedAt', 'email'] as const;

// Property Union Types
export type PublicProperty = typeof publicProperties[number];
export type AuthedProperty = typeof authedProperties[number];
export type PublicUser = Pick<Document, PublicProperty>;
export type AuthedUser = Pick<Document, AuthedProperty>;

/**
 * JWT 
 */
export interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
}

export interface JWT {
  token: string;
  expiresUTC: Date;
}

/**
 * Log/Sign in payload object 
 */
export interface AuthorizePayload {
  email: string;
  displayName: string;
  password: string;
  refreshToken: string;
}

/**
 * Base User Interface
 */
export interface User {
  email: string;
  displayName: string;
  role: Role;
  password: string;
}

/**
 * User Document Interface w/ generated fields + methods
 */
export interface Document extends User, mongoose.Document {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  transform(): PublicUser;
  transformAuthorized(): AuthedUser; 
  passwordMatches(password: string): Promise<boolean>;
  token(): JWT;
  refreshToken(): Promise<RefreshToken.PublicRefreshToken>;
  isRefreshTokenValid(token: string): Promise<boolean>;
  passwordResetToken(): Promise<PasswordResetToken.Document>;
}

/**
 * User Model Interface w/ static methods  
 */
export interface Model extends mongoose.Model<Document> {
  getRoles(): typeof roles;
  findByResetToken(token: string): Promise<Document>;
  findAndCompare(payload: AuthorizePayload): Promise<Document>;
}

/**
 * User Schema
 */
const userSchema = new mongoose.Schema<Document, Model>({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    maxlength: 128,
    required: true,
    index: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 256,
  },
  displayName: {
    type: String,
    maxlength: 16,
    required: true,
    index: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    maxlength: 16,
    index: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: roles,
    default: 'user',
  },
  lastActive: {
    type: Date,
    index: true,
  },
}, {
  timestamps: true,
});


/**
 * Pre-save hook
 */
userSchema.pre<Document>('save', async function save() {
  // Hash passwords on change
  if (this.isModified('password')) {
    const rounds = 10;
    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;
  }

  // Guarantee name value exists, format display name on every change
  if (this.isModified('displayName')) {
    this.name = kebabCase(this.displayName);
  }
});


/**
 * Methods
 */
userSchema.method({

  /**
   * Get public json-able public properties for this user
   * @return {Object<User>}
   */
  transform(): PublicUser {
    return pick(this, publicProperties);
  },

  /**
   * Get public json-able private + public properties for this user
   * @return {Object<User>}
   */
  transformAuthorized(): AuthedUser {
    return pick(this, authedProperties);
  },

  /**
   * Compare a unhased string against the stored password hash
   * @param  {string}  password  unhashed string
   * @return {Promise<boolean>}
   */
  async passwordMatches(password): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  },

  /**
   * Generate a new JWT
   * @return {Promise<JWT>}  the token object
   */
  token(): JWT {
    const now = dayjs.utc();
    const expires = now.add(jwtExpirationInterval, 'minutes');
    const playload: JWTPayload = {
      exp: expires.unix(),
      iat: now.unix(),
      sub: this._id,
    };
    return {
      token: jwt.sign(playload, jwtSecret),
      expiresUTC: expires.toDate(),
    };
  },

  /**
   * Generate and save a refresh token to the db
   * @return {Promise<RefreshToken>}
   */
  async refreshToken(): Promise<RefreshToken.PublicRefreshToken>{
    const token = await RefreshToken.default.generate(this);
    return token.transform();
  },

  /**
   * Check a refresh token a valid
   * @param  {String}  token
   * @return {Promise<boolean>}
   */
  async isRefreshTokenValid(token): Promise<boolean> {
    const email = this.email;
    const refreshToken = await RefreshToken.default.findOne({email, token});
    const isValid = refreshToken && dayjs.utc().isBefore(refreshToken.expiresUTC);

    if (isValid) {
      // Mark the token as used
      refreshToken.usedUTC = new Date();
      await refreshToken.save();
    }
    
    return isValid;
  },

  /**
   * Request a password reset email is sent to the user
   * @return {Promise<boolean>}
   */
  async passwordResetToken() {
    return PasswordResetToken.default.generate(this); 
  },

});


/**
 * Statics
 */
userSchema.statics = {

  getRoles: (): typeof roles => roles,

  /**
   * Request a password reset email is sent to the user
   * @return {Promise<Document>}
   */
  async findByResetToken(token: string): Promise<Document> {
    const tokenDoc = await PasswordResetToken.default.findOne({token});
    if (!tokenDoc) {
      return null;
    }
    // Stash the user id from the token Doc
    const userId = tokenDoc.user;
    
    // Delete any reset tokens issued to the user
    await PasswordResetToken.default.deleteMany({user: userId});

    // Return a promise that resolves to the user
    return this.findOne({_id: userId});
  },


  /**
   * Find a user and compare passwords
   * @param {AuthorizePayload} payload  { email, name, password, refreshToken }
   * @returns {Promise<?Document>}
   */
  async findAndCompare(payload: AuthorizePayload): Promise<Document> {
    const {email, displayName, password, refreshToken} = payload;
    
    // Get the user's safeName from displayName
    const name = kebabCase(displayName);

    // Either query by email or displayName whichever exists
    const query = omitBy({email, name}, str => !str);

    // Look up the user
    const user = await this.findOne(query);

    // Valid user, match password or refreshToken
    if (user) {
      if (password && await user.passwordMatches(password)) {
        return user;
      }
      if (refreshToken && await user.isRefreshTokenValid(refreshToken)) {
        return user;
      }
    }

    return null;
  },
};

export default mongoose.model<Document, Model>('user', userSchema);