import {createLogger, format, transports} from 'winston';
import {isTesting, isDevelopment, logfile} from './vars';
import dayjsBase from 'dayjs';
import dayjsUTC from 'dayjs/plugin/utc';
const dayjs = dayjsBase.extend(dayjsUTC);

/**
 * Use a custom transport to create log model docs
 */
// const Transport = require('winston-transport');
// const Log = require('models/log.model');
// class DBLogWriter extends Transport {
//   constructor(opts) {
//     super(opts);
//   }

//   log(info, callback) {
//     setImmediate(() => {
//       this.emit('logged', info);
//     });

//     const {level, message, ...data} = info;
//     setImmediate(() => Log.create({
//       date: moment.utc().toDate(),
//       level,
//       message,
//       data,
//     }));

//     // Error handling
//     callback();
//   }
// }


/**
 * Add a utc timecode to each entry
 */
const addUTCTimecode = format(logObj => ({
  ...logObj,
  timeUTC: dayjs.utc().format(),
}));


/**
 * Don't log during tests
 */
/* istanbul ignore next */
const ignoreDuringTests = format(logObj => {
  if (isTesting) {
    return false;
  }
  return logObj;
});


/**
 * Create/config winston logger
 */
const logger = createLogger({
  level: 'info',
  format: format.combine(
    addUTCTimecode(),
    ignoreDuringTests(),
    format.json(),
  ),
  // Only use logs in non-testing environments
  transports: [
    new transports.File({filename: 'error.log', level: 'error'}),
    new transports.File({filename: logfile, level: 'info'}),
    // new DBLogWriter({level: 'silly'}),
  ],
});

// If we're not in production
/* istanbul ignore else tests are only run in development */
if (isDevelopment) {
  // Log everything to console
  logger.add(new transports.Console({
    format: format.simple(),
    level: 'debug',
  }));
}

export default logger;