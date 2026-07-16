import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  jwt: {
    secret: process.env.JWT_SECRET || 'pocketide-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  storage: {
    dataDir: process.env.DATA_DIR || join(__dirname, '..', 'data'),
    projectsDir: process.env.PROJECTS_DIR || join(__dirname, '..', 'data', 'projects'),
    usersFile: 'users.json',
    projectsFile: 'projects.json',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  auth: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },

  limits: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    maxProjectNameLength: 100,
    maxFileNameLength: 255,
  },

  isDev: process.env.NODE_ENV !== 'production',
};

export { config };
export default config;
