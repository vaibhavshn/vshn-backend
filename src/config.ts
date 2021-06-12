const mode: string =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';

const MONGO_URL: string =
  mode === 'development'
    ? 'mongodb://127.0.0.1:27017/vshn'
    : `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.eirws.mongodb.net/vshn?retryWrites=true&w=majority`;

export default {
  mode,
  db: {
    url: MONGO_URL,
  },
};
