import { createHmac, randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';

export const getRandomHash = (bytes: number = 3) =>
  randomBytes(bytes).toString('hex');

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
    // expiresIn: '1800s', // expires in 30m
    expiresIn: '3600s', // expires in 60m
  });
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: Function
) => {
  const authHeader: string | undefined = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // token doesn't exist
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
    res.locals.user = user;
    return next();
  });
};
