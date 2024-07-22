import express from 'express';
import {
  getMissingMovies,
  checkMovie,
  updateProcessed,
  updateAllProcessed,
  updateMovie,
  checkAllMovies,
  getFoundMovies,
  getIgnoredMovies,
  moveCheckedToIgnored,
  moveToMissing,
  updateTags,
  moveToFound,
} from '../controllers/movieController.js';

export const movieRoutes = () => {
  const router = express.Router();

  router.get('/found', getFoundMovies);
  router.get('/ignored', getIgnoredMovies);
  router.get('/missing', getMissingMovies);

  router.post('/check', checkMovie);
  router.get('/check-all-movies', checkAllMovies);
  router.post('/move-checked-to-ignored', moveCheckedToIgnored);
  router.post('/move-to-missing', moveToMissing);
  router.post('/move-to-found', moveToFound);
  router.post('/update_processed', updateProcessed);
  router.post('/update_all_processed', updateAllProcessed);
  router.post('/update_movie', updateMovie);
  router.post('/update-tags', updateTags);

  return router;
};
