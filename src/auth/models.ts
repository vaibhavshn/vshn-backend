import { Document, Schema, model } from 'mongoose';

interface User extends Document {
  name: string;
  email: string;
  password: string;
  joinedAt: Date;
}

const UserSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

const UserModel = model('User', UserSchema);

export default UserModel;
export type { User };
