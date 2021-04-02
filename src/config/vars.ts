import path from 'path';
import DotEnv from 'dotenv-safe';

// If env vars not set by docker or kube, try to import the dev .env file
/* istanbul ignore else */
if (!process.env.IS_DOCKER_CONTAINER && !process.env.CI) {
  DotEnv.config({
    path: path.join(__dirname, '../../.env'),
    sample: path.join(__dirname, '../../.env.example'),
    allowEmptyValues: true,
  });
}

export const env = process.env.NODE_ENV;
export const debug = process.env.DEBUG === 'true';
export const isDevelopment: boolean = process.env.NODE_ENV !== 'production';
export const isProduction: boolean = process.env.NODE_ENV === 'production';
export const isTesting: boolean = process.env.NODE_ENV === 'test';

export const jwtExpirationInterval = Number(process.env.JWT_EXPIRATION_MINUTES);
export const publicDir: string = path.join(__dirname, '../../', process.env.PUBLIC_DIR_PATH)
/* istanbul ignore next - coverage tests are not run in production env */
export const logfile = process.env.NODE_ENV === 'production' ? 'combined.log' : 'dev.log';

// Hapi
export const port = Number(process.env.PORT);
export const host: string = process.env.HOST;
export const address: string = process.env.ADDRESS;

// Secrets
export const jwtSecret: string = process.env.JWT_SECRET;
export const mongoUri: string = process.env.MONGO_URI;

// Email 
export const emailSMTP: string = process.env.EMAIL_SERVER;
export const emailFrom: string = process.env.EMAIL_FROM;