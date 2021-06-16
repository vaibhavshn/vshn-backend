import app from '../app';
import request from 'supertest';
import { describe, it } from 'mocha';
import LinkModel from './models';

const getCustomHash = () => Math.random().toString(36).substr(2, 7);

describe('Link Management', () => {
  let accessToken: string = '';
  let randomHash: string = '',
    customHash: string = getCustomHash();

  before((done) => {
    // get user access token
    request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: process.env.VSHN_EMAIL,
        password: process.env.VSHN_PASSWORD,
      })
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        accessToken = res.body.accessToken;
        return done();
      });
  });

  it('should be able to create a random shortened url', (done) => {
    request(app)
      .put('/link')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        url: 'https://example.com',
      })
      .expect((res) => {
        randomHash = res.text;
      })
      .expect(200, done);
  });

  it('should be able to create a custom shortened url', (done) => {
    request(app)
      .put('/link')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        hash: customHash,
        url: 'https://example.com',
      })
      .expect(200, done);
  });

  it('should be able to delete a link', (done) => {
    request(app)
      .delete(`/link/${randomHash}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, done);
  });

  it('should be able to update a link', (done) => {
    request(app)
      .patch(`/link/${customHash}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        hash: customHash,
        url: 'https://new-example.com',
      })
      .expect(200, done);
  });

  it('should be able to get data of all links', (done) => {
    request(app)
      .get('/link')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, done);
  });

  it('should be able to get data of a link', (done) => {
    request(app)
      .get(`/link/${customHash}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, done);
  });

  it('should be able to get total stats of all links', (done) => {
    request(app)
      .get('/link/stats')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, done);
  });

  after(() => {
    LinkModel.deleteOne({ hash: customHash }).exec();
  });
});
