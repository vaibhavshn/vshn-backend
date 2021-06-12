import { Document, Schema, model } from 'mongoose';
// import mongoosePaginate from 'mongoose-paginate-v2';

interface Link extends Document {
  hash?: string;
  url: string;
  uid: string;
  createdAt: Date;
}

const LinkSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  uid: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// LinkSchema.plugin(mongoosePaginate);

const LinkModel = model('Link', LinkSchema);

export default LinkModel;
export type { Link };
