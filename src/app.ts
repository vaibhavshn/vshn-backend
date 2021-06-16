import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import config from './config';
import AuthRouter from './auth/router';
import LinkRouter from './link/router';
import { redirector } from './visit/controllers';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log(`[server] Starting in ${config.mode} mode`);

const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect(config.db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', () => console.error('[mongoose] Error connecting to database'));
db.once('open', () => {
  console.log('[mongoose] Connected to db!');
});

// Parses JSON body
app.use(express.json());

// CORS for frontend
const corsOptions = {
  origin: (origin: any, callback: Function) => {
    callback(null, [
      'https://vshn.in',
      'https://app.vshn.in',
      'https://vshn.vercel.app',
      config.mode === 'development' && [
        'http://localhost:3000',
        'http://192.168.118.121:3000',
      ],
    ]);
  },
};

app.use(cors(corsOptions));

app.disable('etag');
app.disable('x-powered-by');

app.get('/', (req, res) => {
  const appRoute =
    config.mode === 'production'
      ? 'https://app.vshn.in'
      : 'http://localhost:3000';
  res.redirect(301, appRoute);
});

app.use('/auth', AuthRouter);
app.use('/link', LinkRouter);

app.get('/:hash', redirector);

export default app;
