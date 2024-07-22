import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIRECTORY = path.join(__dirname, '../data');
const LOG_DIRECTORY = path.resolve(__dirname, '../logs');

// Ensure the /logs directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

const newLineFormat = winston.format(info => {
  if (info.message) {
    info.message = `${info.message}\n`;
  }
  return info;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    newLineFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIRECTORY, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIRECTORY, 'combined.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(newLineFormat(), winston.format.simple()),
    })
  );
}
