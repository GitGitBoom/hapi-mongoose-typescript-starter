import mongoose, {Schema} from 'mongoose';
import crypto from 'crypto';
import dayjsBase from 'dayjs';
import dayjsUTC from 'dayjs/plugin/utc';
const dayjs = dayjsBase.extend(dayjsUTC);
import type {Document as UserDocument} from './user.model'; 

/**
 * Expiration time (seconds) (6 hours)
 * Index has to be rebuilt for changes to take effect
 */
const expireAfterSeconds = 60 * 60 * 6;

export interface Document extends mongoose.Document {
  _id: string,
  user: UserDocument["_id"],
  token: string,
  expiresAt: Date,
}

export interface ModelModel extends mongoose.Model<Document> {
  generate(user: UserDocument): Document,
}

/**
 * Password reset token
 */
const resetTokenSchema = new Schema<Document, ModelModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  token: {
    type: String,
    index: true,
    required: true,
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

resetTokenSchema.index({createdAt: 1}, {expireAfterSeconds});

resetTokenSchema.statics = {

  /**
   * Generate a reset token object and saves it into the database
   * @param {ObjectId} user
   * @returns {ResetToken}
   */
  async generate(user): Promise<Document> {
    const token = `${user._id}${crypto.randomBytes(40).toString('hex')}`;
    return this.create({
      user: user._id,
      expiresAt: dayjs.utc().add(expireAfterSeconds, 'seconds').toDate(),
      token,
    });
  },

};


export default mongoose.model<Document, ModelModel>('resettoken', resetTokenSchema);
