import mongoose from 'mongoose';
import crypto from 'crypto';
import pick from 'lodash/pick';
import dayjsBase from 'dayjs';
import dayjsUTC from 'dayjs/plugin/utc';
const dayjs = dayjsBase.extend(dayjsUTC);
import type {Document as UserDocument} from './user.model'; 

/**
 * Use a TTL index to remove expired tokens
 */
const expiresAfterMinutes = 60 * 24 * 7;

/**
 * Only allow select properties to be outputed in API responses
 */
const publicProperties = ['token', 'expiresUTC'] as const;


export interface Base {
  user: UserDocument["_id"],
  token: string,
  email: string,
  expiresUTC: Date,
  usedUTC: Date,
}

export type PublicProperty = typeof publicProperties[number];
export type PublicRefreshToken = Pick<Document, PublicProperty>;

export interface Document extends Base, mongoose.Document {
  transform(): PublicRefreshToken;
}

export interface Model extends mongoose.Model<Document> {
  generate(user: UserDocument): Promise<Document>;
}

/**
 * Refresh Token Schema
 */
const refreshTokenSchema = new mongoose.Schema<
  Document,
  Model
>({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  email: {
    type: 'String',
    ref: 'User',
    required: true,
  },
  expiresUTC: {
    type: Date,
    required: true,
  },
  usedUTC: {
    type: Date,
  },
});

// Remove 0 secondas after the expiresUTC date 
refreshTokenSchema.index({expiresUTC: 1}, {expireAfterSeconds: 1});

// Allow the token to exists a few minutes after being used
refreshTokenSchema.index({usedUTC: 1}, {expireAfterSeconds: 180});
refreshTokenSchema.index({email: 1, token: 1});


/**
 * Methods
 */
refreshTokenSchema.method({

  transform() {
    return pick(this, publicProperties);
  },

});

/**
 * Statics
 */
refreshTokenSchema.statics = {

  /**
   * Generate a refresh token object and saves it into the database
   * @param {Model<User>} user
   * @returns {RefreshToken}
   */
  async generate(user: UserDocument): Promise<Document> {
    const token = `${user._id}.${crypto.randomBytes(40).toString('hex')}`;
    return this.create({
      user: user._id,
      email: user.email,
      expiresUTC: dayjs.utc().add(expiresAfterMinutes, 'minutes').toDate(),
      token,
    });
  },

};

export default mongoose.model<
  Document,
  Model
>('RefreshToken', refreshTokenSchema);