import express from 'express';

const MODE =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';
console.log(`[server] Starting in ${MODE} mode`);

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`[server] Listening on port: ${process.env.PORT || 5000} `);
});
