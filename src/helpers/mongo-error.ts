import type {MongoError} from 'mongodb';

/**
 * Check if an error is caused by duplicate keys
 * @param  {MongoError}     error
 * @return {Boolean}
 */
export const isDuplicateError = (error: MongoError): boolean => {
  return error && error.code === 11000;
};


/**
 * List duplicate fields from mongo error
 * @note Mongod type does not include keyPattern but it exists since 4.3
 * @param  {MongoError}     error
 * @return {String[]|void}  array of field names
 */
interface DuplicateError extends MongoError {
  code: 11000;
  keyPattern: {[key: string]: string};
}
export const getDuplicateFields = (error: DuplicateError): string[] => {
  return error.keyPattern && Object.keys(error.keyPattern);
};
