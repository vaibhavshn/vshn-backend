import { createHmac } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

export const hasher = (password: string): false | string => {
  if (!process.env.SALT) return false;

  const SALT: string = process.env.SALT;

  const hash = createHmac('sha512', SALT);
  hash.update(password);
  const value = hash.digest('hex');

  return value;
};

export const generateAccessToken = (
  data: Record<string, any>
): false | string => {
  if (!process.env.SECRET) return false;
  const SECRET: string = process.env.SECRET;

  return sign(data, SECRET, {
    expiresIn: '1800s', // expires in 30m
  });
};

export const authenticateToken = (req: any, res: any, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401);
    return res.send();
  }

  if (!process.env.SECRET) return res.status(500);
  const SECRET: string = process.env.SECRET;

  verify(token, SECRET, (err: any, user: any) => {
    if (err) {
      res.status(401);
      return res.send();
    }
    return next();
  });
};
