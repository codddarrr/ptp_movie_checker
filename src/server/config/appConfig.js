import path from 'path';
import { engine } from 'express-handlebars';

export const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

export const viewEngineSetup = (app, dirname) => {
  app.engine(
    'handlebars',
    engine({
      layoutsDir: path.join(dirname, 'views', 'layouts'),
      partialsDir: path.join(dirname, 'views', 'partials'),
      defaultLayout: 'main',
      helpers: {
        ne: (a, b) => a !== b,
        json: context => JSON.stringify(context),
      },
    })
  );
  app.set('view engine', 'handlebars');
  app.set('views', path.join(dirname, 'views'));
};
