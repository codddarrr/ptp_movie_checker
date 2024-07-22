import { homeRoutes } from './homeRoutes.js';
import { movieRoutes } from './movieRoutes.js';

export const setupRoutes = (app, dirname) => {
  app.use('/', homeRoutes(dirname));
  app.use('/movies', movieRoutes());
};
