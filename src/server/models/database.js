import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = path.join(__dirname, '..', 'data', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DATABASE_PATH,
  logging: false,
});

export default sequelize;
