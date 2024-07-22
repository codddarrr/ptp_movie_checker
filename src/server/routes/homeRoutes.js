import express from 'express';
import fs from 'fs';
import path from 'path';

export const homeRoutes = dirname => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const scriptContent = fs.readFileSync(
      path.join(dirname, '..', 'public', 'js', 'ptp_movie_checker.vm.user.js'),
      'utf-8'
    );
    const scriptUrl = `https://${process.env.APP_DOMAIN}/js/ptp_movie_checker.vm.user.js`;
    res.render('index', {
      title: 'Configuration',
      scriptContent: scriptContent,
      scriptUrl: scriptUrl,
      apiUser: process.env.API_USER,
      apiKey: process.env.API_KEY,
      ptpImgApiKey: process.env.PTPIMG_API_KEY,
    });
  });

  return router;
};
