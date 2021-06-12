import express from 'express';
import { connect, connection, set } from 'mongoose';
import config from './config';
import AuthRouter from './auth/router';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log(config);
console.log(`[server] Starting in ${config.mode} mode`);

const app = express();

set('useNewUrlParser', true);
set('useFindAndModify', false);
set('useCreateIndex', true);

connect(config.db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = connection;

db.on('error', () => console.error('[mongoose] Error connecting to database'));
db.once('open', () => {
  console.log('[mongoose] Connected to db!');
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', AuthRouter);

export default app;
