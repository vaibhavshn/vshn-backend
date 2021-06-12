import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { pick } from 'lodash';
import { getRandomHash } from '../utils/hash';

import LinkModel, { Link } from './models';
import { PaginateResult } from 'mongoose';

const addRandomHashLink = (
  uid: string,
  url: string,
  res: Response,
  iteration: number
) => {
  if (iteration > 5) {
    res.send(500);
    res.send('Unknown error');
  }
  const hash = getRandomHash();
  linkAdder(uid, url, hash)
    .then((link: Link) => {
      res.status(200);
      res.send(hash);
    })
    .catch((error: Error) => {
      addRandomHashLink(uid, url, res, iteration + 1);
    });
};

const linkAdder = (uid: string, url: string, hash: string) => {
  let _url = '';
  // prepend https:// if url doesn't start with https?://
  if (!/^https?:\/\//.test(url)) {
    _url = 'https://' + url;
  }
  const link = new LinkModel({
    uid,
    hash,
    url: _url,
  });
  return link.save();
};

export const addLink = (req: Request, res: Response) => {
  const { user } = res.locals;

  if (!user) {
    res.status(401);
    return res.send();
  }

  const linkData = req.body;

  if (!('url' in linkData) || linkData.url.length === 0) {
    res.status(400);
    return res.send('No URL');
  }

  if ('hash' in linkData) {
    if (linkData.hash.length < 4) {
      res.send(400);
      return res.send('Short hash');
    }

    const hash: string = linkData.hash;

    linkAdder(user.id, linkData.url, hash)
      .then((link: Link) => {
        res.status(200);
        res.send(hash);
      })
      .catch((error: Error) => {
        if (error instanceof MongoError) {
          res.status(409);
          res.send('Hash in use');
        } else {
          res.send(500);
          res.send('Unknown error');
        }
      });
  } else {
    addRandomHashLink(user.id, linkData.url, res, 1);
  }
};

export const getLink = (req: Request, res: Response) => {
  const { user } = res.locals;

  if (!user) {
    res.status(401);
    return res.send();
  }

  const hash = req.params.hash;

  LinkModel.findOne({ hash, uid: user.id })
    .lean()
    .then((link: Link) => {
      if (!link) {
        res.status(404);
        return res.send('Not found');
      }
      res.status(200);
      res.json({
        url: link.url,
        createdAt: link.createdAt,
      });
    })
    .catch((error: Error) => {
      res.status(500);
      res.send('Unknown error');
    });
};

export const getAllLinks = (req: Request, res: Response) => {
  const { user } = res.locals;

  if (!user) {
    res.status(401);
    return res.send();
  }

  const page = Number(req.query.page) ?? 1;
  const batchSize = 10;

  LinkModel.paginate(
    { uid: user.id },
    { page, sort: { createdAt: -1 }, lean: true, limit: batchSize }
  )
    .then((links: PaginateResult<Link>) => {
      res.json({
        ...links,
        docs: links.docs.map((link) =>
          pick(link, ['hash', 'url', 'createdAt'])
        ),
      });
    })
    .catch((_) => {
      res.status(500);
      res.send('Unknown error');
    });
};

export const deleteLink = (req: Request, res: Response) => {
  const { user } = res.locals;
  if (!user) {
    res.status(401);
    return res.send();
  }

  const hash = req.params.hash;

  LinkModel.deleteOne({ hash, uid: user.id })
    .then((result: { deletedCount?: number }) => {
      if (result.deletedCount == 0) {
        res.status(404);
        res.send('Not found');
      } else {
        res.status(200);
        res.send('Deleted');
      }
    })
    .catch((_) => {
      res.status(500);
      res.send('Unknown error');
    });
};

const getValidURL = (url: string): string => {
  if (!/^https?:\/\//.test(url)) {
    return `https://${url}`;
  }
  return url;
};

export const patchLink = (req: Request, res: Response) => {
  const { user } = res.locals;
  if (!user) {
    res.status(401);
    return res.send();
  }

  const hash = req.params.hash;

  const linkUpdate = pick(req.body, ['hash', 'url']);
  if ('url' in linkUpdate) {
    linkUpdate.url = getValidURL(linkUpdate.url);
  }

  LinkModel.updateOne({ hash, uid: user.id }, linkUpdate)
    .then((_) => {
      res.status(200);
      res.send('Patched');
    })
    .catch((e) => {
      res.status(500);
      res.send('Unknown error');
    });
};
