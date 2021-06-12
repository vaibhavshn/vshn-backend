import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import config from './config';
import AuthRouter from './auth/router';
import LinkRouter from './link/router';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log(config);
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
      config.mode === 'development' && 'http://localhost:3000',
    ]);
  },
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.status(200);
  res.json({ status: 'ok' });
});

app.use('/auth', AuthRouter);
app.use('/link', LinkRouter);

export default app;
