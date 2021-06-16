import request from 'supertest';
import { describe, it } from 'mocha';

import app from '../app';
import UserModel from './models';

const getRandomEmail = () =>
  `test_user_${Math.random().toString(36).substr(2, 7)}@example.com`;

describe('User Authentication', () => {
  let accessToken: string = '';
  const email: string = getRandomEmail();

  it('should be able to create an account', (done) => {
    request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({
        name: 'Test User',
        email: email,
        password: 'root',
      })
      .expect((res) => {
        accessToken = res.body.accessToken ?? '';
      })
      .expect(200, done);
  });

  it('should not be able to create an account with no or blank fields', (done) => {
    request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({
        name: 'Test User',
        password: '',
      })
      .expect(400, done);
  });

  it('should be able to log in', (done) => {
    request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: email,
        password: 'root',
      })
      .expect(200, done);
  });

  it('should not be able to log in with invalid data', (done) => {
    request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: email,
        password: 'root2',
      })
      .expect(401, done);
  });

  it('authToken is valid', (done) => {
    request(app)
      .head('/auth/token')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, done);
  });

  it('invalid authToken is invalid', (done) => {
    request(app)
      .head('/auth/token')
      .set('Authorization', `Bearer ${accessToken}aaa`)
      .expect(401, done);
  });

  after(() => {
    UserModel.deleteOne({ email: email }).exec();
  });
});
