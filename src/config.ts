const mode: string =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

const MONGO_URL: string =
  mode === 'production'
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.eirws.mongodb.net/vshn?retryWrites=true&w=majority`
    : 'mongodb://127.0.0.1:27017/vshn';

export default {
  mode,
  db: {
    url: MONGO_URL,
  },
};
