import { Request, Response } from 'express';
import { Error } from 'mongoose';
import { MongoError } from 'mongodb';

import UserModel, { User } from './models';
import { validateFields } from '../utils/forms';
import { generateAccessToken, hasher } from '../utils/hash';

interface RegisterFields extends Record<string, any> {
  name: string;
  email: string;
  password: string;
}

interface LoginFields extends Record<string, any> {
  email: string;
  password: string;
}

export const registerUser = (req: Request, res: Response) => {
  const userData: RegisterFields = req.body;

  {
    const validation = validateFields(userData, ['name', 'email', 'password']);

    if (!validation.valid) {
      res.status(400);
      return res.json(validation);
    }
  }

  const password: boolean | string = hasher(userData.password);

  if (!password) {
    res.status(500).json({ status: 'error' });
  }

  const user = new UserModel({
    name: userData.name,
    email: userData.email,
    password,
  });

  user
    .save()
    .then((user: User) => {
      res.status(200);
      res.json({
        accessToken: generateAccessToken({
          id: user._id,
          name: user.name,
          email: user.email,
        }),
      });
    })
    .catch((error: Error) => {
      if (error instanceof MongoError) {
        res.status(409);
        res.send('Email exists');
      } else {
        res.status(500);
        res.send('Unknown error');
      }
    });
};

export const logIn = (req: Request, res: Response) => {
  const userData: LoginFields = req.body;

  const password = hasher(userData.password);

  UserModel.findOne({ email: userData.email }, (err: Error, user: User) => {
    if (err) {
      res.status(500);
      return res.json({ status: 'error', error: 'unknown error' });
    }
    if (!user) {
      res.status(404);
      return res.json({ status: 'error', error: 'user not found' });
    }

    if (user.password === password) {
      res.status(200);
      res.json({
        accessToken: generateAccessToken({
          id: user.id,
          name: user.name,
          email: user.email,
        }),
      });
    } else {
      res.status(401);
      res.json({ status: 'error', error: 'invalid info' });
    }
  });
};
