import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { corsOptions, viewEngineSetup } from './config/appConfig.js';
import { setupRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { initializeDatabase } from './controllers/movieController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcRoot = path.resolve(__dirname, '..');

const app = express();

app.use((req, res, next) => {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    res.locals.assets = JSON.parse(manifestContent);
  } else {
    res.locals.assets = {};
  }
  next();
});

const PORT = process.env.APP_PORT || 3000;
const DOMAIN = process.env.APP_DOMAIN || 'localhost';
const PROXIES = JSON.parse(
  process.env.PROXY_DOMAINS ||
    '[{"proxy_domain":"pmc.cathode-ray.tube","target_domain":"www.cathode-ray.tube","original_hostname":"www.cathode-ray.tube"}]'
);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(srcRoot, 'package.json'), 'utf8')
);
const version = packageJson.version || Date.now();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(srcRoot, 'public')));
app.set('views', path.join(srcRoot, 'views'));
app.locals.version = version;

viewEngineSetup(app, srcRoot);
setupRoutes(app, __dirname);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeDatabase();

    const key = fs.readFileSync('/etc/ssl/key.pem');
    const cert = fs.readFileSync('/etc/ssl/cert.pem');
    const server = https.createServer({ key, cert }, app);

    server.listen(PORT, () => {
      console.clear();
      logger.info(
        chalk.cyan.bold(`\n\nProxy domains:\n\n`) +
          chalk.green(
            `${PROXIES.map(
              proxy =>
                `https://${proxy.proxy_domain} -> https://${proxy.target_domain}`
            ).join('\n')}\n\n`
          ) +
          chalk.cyan.bold(`Application domain:\n\n`) +
          chalk.yellow(
            `Running at https://${DOMAIN}\n\n` +
              `Instructions:\n\n` +
              `1. Make /etc/hosts entries for the proxy domains and application domains,\n` +
              `2. Visit https://${DOMAIN} in your browser,\n` +
              `3. Accept the self-signed certificate,\n` +
              `4. Install the ViolentMonkey script and modify the header to add your private tracker(s),\n` +
              `5. Visit any tracker you added,\n` +
              `6. If a tracker has secure CSP or CORS settings and the script fails, you will need to update PROXY_DOMAINS in .env \n` +
              `   to add a proxy automatically, then visit the tracker via the proxy domain.\n`
          )
      );
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
