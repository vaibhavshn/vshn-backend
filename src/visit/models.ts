import { Document, Schema, model } from 'mongoose';

interface Visit extends Document {
  lid: string;
  ipAddress: string;
  browser: string;
  os: string;
  location: string;
  visitedAt: Date;
}

const VisitSchema = new Schema<Visit>({
  lid: { type: String, required: true },
  ipAddress: { type: String, required: true },
  browser: { type: String, required: true },
  os: { type: String, required: true },
  location: { type: String, required: true },
  vistitedAt: { type: Date, default: Date.now },
});

const VisitModel = model('Visit', VisitSchema);

export default VisitModel;
export type { Visit };
