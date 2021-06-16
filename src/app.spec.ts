import app from './app';
import { connection } from 'mongoose';
import { describe, it } from 'mocha';
import request from 'supertest';
import { strictEqual } from 'assert';

describe('Initialization', () => {
  it('should be connected to database', () => {
    strictEqual(connection.readyState, 1);
  });
});

describe('App', () => {
  it('/looper should be redirecting to looper.io', (done) => {
    request(app)
      .get('/looper')
      .expect(301)
      .end((err, res) => {
        if (err) return done(err);
        strictEqual(res.headers['location'], 'https://looper.io');
        done();
      });
  });
});
