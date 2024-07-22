import fetch from 'node-fetch';
import axios from 'axios';
import cheerio from 'cheerio';
import { promisify } from 'util';
import PtpImgUploader from '../utils/ptpImgUploader.js';
import MissingMovie from '../models/MissingMovie.js';
import FoundMovie from '../models/FoundMovie.js';
import IgnoredMovie from '../models/IgnoredMovie.js';
import sequelize from '../models/database.js';
import { Op } from 'sequelize';
import { EventEmitter } from 'events';

const sleep = promisify(setTimeout);

class RequestQueue {
  constructor(intervalMs = 2000) {
    this.queue = [];
    this.intervalMs = intervalMs;
    this.isProcessing = false;
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      if (!this.isProcessing) {
        this.process();
      }
    });
  }

  async process() {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift();
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      await sleep(this.intervalMs);
    }
    this.isProcessing = false;
  }
}

const PTP_REQUEST_INTERVAL = process.env.PTP_REQUEST_INTERVAL || 2000;
const ptpQueue = new RequestQueue(PTP_REQUEST_INTERVAL);

const renderMovies = async (req, res, next, Model, title) => {
  try {
    const movies = await Model.findAll({
      attributes: [
        'imdb_url',
        'url',
        'title',
        'akas',
        'year',
        'plotText',
        'poster_url',
        'timestamp',
        'processed',
        'tags',
      ],
    });
    res.render(Model.name.toLowerCase() + 's', {
      title: `${title}`,
      matches: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const getMissingMovies = (req, res, next) =>
  renderMovies(req, res, next, MissingMovie, 'Missing Movies');
export const getIgnoredMovies = (req, res, next) =>
  renderMovies(req, res, next, IgnoredMovie, 'Ignored Movies');

export const getFoundMovies = async (req, res, next) => {
  try {
    const foundMovies = await FoundMovie.findAll({
      order: [['timestamp', 'DESC']],
    });
    const movies = foundMovies.map(movie => movie.get({ plain: true }));
    res.render('foundmovies', {
      title: 'Found Movies',
      movies: movies,
    });
  } catch (error) {
    next(error);
  }
};
export const updateTags = async (req, res) => {
  const { id, tags } = req.body;
  try {
    const movie = await MissingMovie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    movie.tags = tags;
    await movie.save();
    res.json({ success: true, tags: movie.tags });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  }
};

export const moveToMissing = async (req, res) => {
  const { imdb_url } = req.body;

  if (!imdb_url) {
    return res.status(400).json({ error: 'Invalid request: missing imdb_url' });
  }

  try {
    const ignoredMovie = await IgnoredMovie.findByPk(imdb_url);
    if (!ignoredMovie) {
      return res.status(404).json({ error: 'Movie not found in Ignored list' });
    }

    await MissingMovie.create({
      ...ignoredMovie.toJSON(),
      timestamp: new Date(),
    });

    await ignoredMovie.destroy();

    res.json({ message: 'Movie successfully moved to Missing Movies' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while moving the movie' });
  }
};

export const moveToFound = async (req, res) => {
  const { imdb_url } = req.body;

  if (!imdb_url) {
    return res.status(400).json({ error: 'Invalid request: missing imdb_url' });
  }

  try {
    const ignoredMovie = await IgnoredMovie.findByPk(imdb_url);
    if (!ignoredMovie) {
      return res.status(404).json({ error: 'Movie not found in Ignored list' });
    }

    await FoundMovie.create({
      ...ignoredMovie.toJSON(),
      timestamp: new Date(),
      ptp_data: null,
    });

    await ignoredMovie.destroy();

    res.json({ message: 'Movie successfully moved to Found Movies' });
  } catch (error) {
    console.error('Error moving movie to Found:', error);
    res.status(500).json({ error: 'An error occurred while moving the movie' });
  }
};

export const moveCheckedToIgnored = async (req, res) => {
  let movedCount = 0;

  try {
    const checkedMovies = await MissingMovie.findAll({
      where: { processed: true },
    });

    for (const movie of checkedMovies) {
      await IgnoredMovie.create({
        ...movie.toJSON(),
        timestamp: new Date(),
      });

      await movie.destroy();
      movedCount++;
    }

    res.json({
      message: 'Move completed',
      movedCount: movedCount,
    });
  } catch (error) {
    console.error('Error in moveCheckedToIgnored:', error);
    res.status(500).json({
      error: 'An error occurred while moving checked movies',
      movedCount,
    });
  }
};

export const updateProcessed = async (req, res) => {
  const { id, processed } = req.body;

  if (!id || processed === undefined) {
    return res
      .status(400)
      .json({ error: 'Invalid request: id or processed value is missing' });
  }

  try {
    const movie = await MissingMovie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    movie.processed = processed === 'true';
    await movie.save();
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update movie' });
  }
};

export const updateAllProcessed = async (req, res) => {
  const { ids, processed } = req.body;
  console.log('Received request to update processed status:', {
    ids,
    processed,
  });

  if (!Array.isArray(ids) || typeof processed !== 'string') {
    console.error('Invalid input received:', { ids, processed });
    return res.status(400).json({
      error: 'Invalid input. Expected an array of ids and a processed status.',
    });
  }

  const processedBoolean = processed === 'true';
  console.log('Setting all movies to processed state:', processedBoolean);

  try {
    const result = await sequelize.transaction(async t => {
      const imdbUrls = ids.map(id => `https://www.imdb.com/title/${id}/`);

      const [updatedCount] = await MissingMovie.update(
        { processed: processedBoolean },
        {
          where: { imdb_url: { [Op.in]: imdbUrls } },
          transaction: t,
        }
      );

      console.log(
        `Updated ${updatedCount} movies to processed state: ${processedBoolean}`
      );
      return updatedCount;
    });

    res.status(200).json({
      message:
        result > 0
          ? 'Movies updated successfully'
          : 'No movies needed updating',
      updatedCount: result,
    });
  } catch (error) {
    console.error(
      'Error updating processed status for multiple movies:',
      error
    );
    res.status(500).json({ error: 'An error occurred while updating movies' });
  }
};

export const checkMovie = async (req, res, next) => {
  const { imdb_id, url } = req.body;
  const API_USER = process.env.API_USER;
  const API_KEY = process.env.API_KEY;
  const PTPIMG_API_KEY = process.env.PTPIMG_API_KEY;
  const PTP_API_URL = `https://passthepopcorn.me/torrents.php?imdb=${imdb_id}&grouping=0&noredirect=1&pretty`;
  const IMDB_URL = `https://www.imdb.com/title/${imdb_id}/`;

  const headers = {
    ApiUser: API_USER,
    ApiKey: API_KEY,
  };

  try {
    // Check if the IMDb URL already exists in the database
    let existingMovie = await MissingMovie.findByPk(IMDB_URL);
    if (existingMovie) {
      return res.json({ error: 'Exists in your list' });
    }
    existingMovie = await FoundMovie.findByPk(IMDB_URL);
    if (existingMovie) {
      return res.json({ error: 'Exists on PTP' });
    }
    existingMovie = await IgnoredMovie.findByPk(IMDB_URL);
    if (existingMovie) {
      return res.json({ error: 'Exists in your ignored list' });
    }

    // Proceed with the PTP API call
    let ptp_data;
    let retries = 3;
    while (retries > 0) {
      try {
        const ptp_response = await ptpQueue.add(() =>
          fetch(PTP_API_URL, { headers })
        );
        if (!ptp_response.ok) {
          throw new Error(`HTTP error! status: ${ptp_response.status}`);
        }
        ptp_data = await ptp_response.json();
        break;
      } catch (error) {
        console.error(`PTP API call failed. Retries left: ${retries - 1}`);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
    }

    let movieData = { imdb_id, url, ptp_data };

    if (!ptp_data || !ptp_data.Torrents || ptp_data.Torrents.length === 0) {
      const imdb_response = await axios.get(IMDB_URL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/58.0.3029.110 Safari/537.3',
        },
      });
      const $ = cheerio.load(imdb_response.data);

      const jsonData = JSON.parse($('#__NEXT_DATA__').html());

      const aboveTheFoldData = jsonData.props.pageProps.aboveTheFoldData;
      const mainColumnData = jsonData.props.pageProps.mainColumnData;
      const title = aboveTheFoldData.titleText?.text || '';
      const year = aboveTheFoldData.releaseYear?.year || '';
      const akas = mainColumnData.akas.edges
        .map(aka => aka.node.text)
        .join(', ');
      const plotText = aboveTheFoldData?.plot?.plotText.plainText || '';
      let poster_url = aboveTheFoldData.primaryImage?.url || '';

      let isSeries = false;
      if (
        aboveTheFoldData.titleType.isSeries ||
        aboveTheFoldData.titleType.isEpisode
      ) {
        isSeries = true;
      }
      if (['tvEpisode'].includes(aboveTheFoldData.titleType.id)) {
        isSeries = true;
      }
      if (isSeries) {
        return res.json({ error: 'TV Series.' });
      }

      const genres =
        jsonData.props.pageProps.aboveTheFoldData.genres.genres.map(
          genre => genre.text
        );

      if (genres.includes('Adult')) {
        return res.json({ error: 'Tagged as Adult on IMDb.' });
      }

      if (PTPIMG_API_KEY && poster_url !== '') {
        const uploader = new PtpImgUploader(PTPIMG_API_KEY);
        try {
          const urls = await uploader.uploadUrl(poster_url);
          poster_url = urls[0];
        } catch (error) {
          console.error('Upload failed:', error.message);
        }
      }

      movieData = {
        ...movieData,
        title,
        year,
        akas,
        plotText,
        poster_url,
      };

      // Save to database
      await MissingMovie.create({
        imdb_url: IMDB_URL,
        url,
        title,
        akas,
        year,
        plotText,
        poster_url,
        timestamp: new Date(),
      });
    } else {
      try {
        const [foundMovie, created] = await FoundMovie.findOrCreate({
          where: { imdb_url: IMDB_URL },
          defaults: {
            url,
            title: ptp_data.title || '',
            akas: '',
            year: ptp_data.year || '',
            plotText: '',
            poster_url: '',
            timestamp: new Date(),
            ptp_data,
          },
        });

        if (!created) {
          // If the movie already exists, update it
          await foundMovie.update({
            url,
            title: ptp_data.title || foundMovie.title,
            year: ptp_data.year || foundMovie.year,
            timestamp: new Date(),
            ptp_data,
          });
        }

        // Remove from MissingMovie or IgnoredMovie table
        await MissingMovie.destroy({ where: { imdb_url: IMDB_URL } });
        await IgnoredMovie.destroy({ where: { imdb_url: IMDB_URL } });

        console.log(
          `Movie found on PTP and ${created ? 'created' : 'updated'} in FoundMovie: ${IMDB_URL}`
        );
      } catch (dbError) {
        console.error('Error handling database operations:', dbError);
        throw dbError; // Re-throw the error to be caught by the outer try-catch
      }
    }
    res.json(movieData);
  } catch (error) {
    console.error('Error in checkMovie:', error);
    res.status(500).json({
      error:
        'An error occurred while checking the movie. Please try again later.',
    });
  }
};

const movieCheckEmitter = new EventEmitter();

export const checkAllMovies = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendEvent = eventData => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  const listener = data => sendEvent(data);
  movieCheckEmitter.on('update', listener);

  // Start the movie checking process
  process.nextTick(() => runCheckAllMovies(sendEvent));

  // Remove listener when client disconnects
  req.on('close', () => {
    movieCheckEmitter.removeListener('update', listener);
  });
};

async function runCheckAllMovies(sendEvent) {
  const BATCH_SIZE = 10;
  const API_USER = process.env.API_USER;
  const API_KEY = process.env.API_KEY;
  let processedCount = 0;
  let movedCount = 0;
  let totalMovies = 0;

  console.log('Starting checkAllMovies process');

  try {
    const regularMoviesCount = await MissingMovie.count();
    const ignoredMoviesCount = await IgnoredMovie.count();
    totalMovies = regularMoviesCount + ignoredMoviesCount;
    console.log(
      `Total movies to process: ${totalMovies} (Regular: ${regularMoviesCount}, Ignored: ${ignoredMoviesCount})`
    );

    sendEvent({ type: 'start', total: totalMovies });

    for (let offset = 0; offset < totalMovies; offset += BATCH_SIZE) {
      console.log(`Processing batch starting at offset ${offset}`);

      const regularMovies = await MissingMovie.findAll({
        limit: BATCH_SIZE,
        offset: offset,
        order: [['createdAt', 'ASC']],
      });

      const ignoredMovies = await IgnoredMovie.findAll({
        limit: BATCH_SIZE,
        offset: Math.max(0, offset - regularMoviesCount),
        order: [['createdAt', 'ASC']],
      });

      const combinedMovies = [...regularMovies, ...ignoredMovies].slice(
        0,
        BATCH_SIZE
      );

      for (const movie of combinedMovies) {
        try {
          console.log(`Processing movie: ${movie.imdb_url}`);
          const imdb_id = movie.imdb_url.split('/title/')[1].replace('/', '');
          const PTP_API_URL = `https://passthepopcorn.me/torrents.php?imdb=${imdb_id}&grouping=0&noredirect=1&pretty`;

          let ptp_data;
          let retries = 3;
          while (retries > 0) {
            try {
              const ptp_response = await fetch(PTP_API_URL, {
                headers: { ApiUser: API_USER, ApiKey: API_KEY },
              });
              if (!ptp_response.ok) {
                throw new Error(`HTTP error! status: ${ptp_response.status}`);
              }
              ptp_data = await ptp_response.json();
              break;
            } catch (error) {
              console.error(
                `PTP API call failed for ${imdb_id}. Retries left: ${retries - 1}`
              );
              retries--;
              if (retries === 0) throw error;
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
            }
          }

          if (ptp_data && ptp_data.Torrents && ptp_data.Torrents.length > 0) {
            console.log(`Movie found on PTP: ${movie.imdb_url}`);

            await sequelize.transaction(async t => {
              // Use findOrCreate to handle potential race conditions
              const [foundMovie, created] = await FoundMovie.findOrCreate({
                where: { imdb_url: movie.imdb_url },
                defaults: {
                  url: movie.url,
                  title: ptp_data.Title || movie.title,
                  akas: movie.akas,
                  year: ptp_data.Year || movie.year,
                  plotText: movie.plotText,
                  poster_url: movie.poster_url,
                  timestamp: new Date(),
                  ptp_data: ptp_data,
                  processed: movie.processed,
                  tags: movie.tags,
                },
                transaction: t,
              });

              if (!created) {
                // If the movie already exists, update it
                await foundMovie.update(
                  {
                    title: ptp_data.Title || foundMovie.title,
                    year: ptp_data.Year || foundMovie.year,
                    timestamp: new Date(),
                    ptp_data: ptp_data,
                    processed: movie.processed,
                    tags: movie.tags,
                  },
                  { transaction: t }
                );
              }

              // Remove from MissingMovie or IgnoredMovie table
              await movie.destroy({ transaction: t });
            });

            movedCount++;
          } else {
            console.log(`Movie not found on PTP: ${movie.imdb_url}`);
          }

          processedCount++;
          console.log(`Processed ${processedCount}/${totalMovies} movies`);
          sendEvent({
            type: 'progress',
            processedCount,
            movedCount,
            total: totalMovies,
          });
        } catch (error) {
          console.error(
            `Error processing movie ${movie.imdb_url}:`,
            error.message
          );
          sendEvent({
            type: 'error',
            message: `Error processing movie ${movie.imdb_url}: ${error.message}`,
          });
        }
      }

      // Add a small delay between batches to further reduce load
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('Finished processing all movies');
    sendEvent({
      type: 'complete',
      processedCount,
      movedCount,
      total: totalMovies,
    });
  } catch (error) {
    console.error('Error in checkAllMovies:', error);
    sendEvent({
      type: 'error',
      message: 'An error occurred while checking movies',
    });
  } finally {
    // Ensure the client knows the stream is about to end
    sendEvent({ type: 'end' });
  }
}

export const updateMovie = async (req, res) => {
  const { imdb_url, url, title, akas, year, plotText, poster_url } = req.body;

  if (!imdb_url) {
    return res.status(400).json({ error: 'Invalid request: missing imdb_url' });
  }

  try {
    const movie = await MissingMovie.findByPk(imdb_url);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Update only the provided fields
    const updatedFields = { url, title, akas, year, plotText, poster_url };
    Object.keys(updatedFields).forEach(
      key => updatedFields[key] === undefined && delete updatedFields[key]
    );

    await movie.update(updatedFields);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update movie' });
  }
};

// Database initialization
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database schema updated successfully.');

    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Existing tables:', tables);

    const expectedTables = ['FoundMovies', 'IgnoredMovies', 'MissingMovies'];
    const missingTables = expectedTables.filter(
      table => !tables.includes(table)
    );

    if (missingTables.length > 0) {
      console.error('Some expected tables are missing:', missingTables);
      throw new Error('Database initialization incomplete');
    }

    console.log('All expected tables are present in the database.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

export { initializeDatabase };
