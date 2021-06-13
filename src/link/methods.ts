import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { pick } from 'lodash';
import { getRandomHash } from '../utils/hash';

import LinkModel, { Link } from './models';
import VisitModel from '../visit/models';
// import { PaginateResult } from 'mongoose';

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

const getLinkWithStats = (res: Response, link: Link) => {
  const promises = Promise.all([
    // Get unique views
    VisitModel.aggregate([
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
        },
      },
      { $count: 'documentCount' },
    ]),
    // alternative
    // VisitModel.find({ lid: link._id }).distinct('ipAddress'),

    // Get total views
    VisitModel.aggregate([
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: 'total',
          total: { $sum: '$count' },
        },
      },
    ]),
    //alterative
    // VisitModel.find({ lid: link._id }).countDocuments(),

    // Get browser stats
    VisitModel.aggregate([
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
        },
      },
    ]),

    // Get OS stats
    VisitModel.aggregate([
      {
        $group: {
          _id: '$os',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  promises
    .then(([uniqueViews, totalViews, browserResults, osResults]) => {
      const browsers: Record<string, number> = {},
        os: Record<string, number> = {};

      for (const row of browserResults) {
        browsers[row._id] = row.count;
      }

      for (const row of osResults) {
        os[row._id] = row.count;
      }

      res.status(200);
      res.json({
        ...pick(link, ['url', 'createdAt']),
        uniqueViews: uniqueViews[0].documentCount,
        totalViews: totalViews[0].total,
        browsers,
        os,
      });
    })
    .catch((err: Error) => {
      console.log(err);
      res.status(500);
      res.send('Unknown error');
    });
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
      getLinkWithStats(res, link);
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

  let page: number = 1;
  const batchSize = 10;

  try {
    page = Number(req.query.page) ?? 1;
  } catch (e) {}

  if (!page) page = 1;

  // pagination
  Promise.all([
    LinkModel.find({ uid: user.id }).countDocuments(),
    LinkModel.find({ uid: user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * batchSize)
      .limit(batchSize)
      .lean(),
  ])
    .then(([totalCount, links]) => {
      const pages = Math.ceil(totalCount / batchSize);

      res.json({
        links: links.map((link: Link) => pick(link, ['hash', 'url'])),
        hasNextPage: page < pages ? true : false,

        page,
        pages,
      });
    })
    .catch((error: Error) => {
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
    .catch((e: Error) => {
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
    .then((n: Record<string, number>) => {
      res.status(200);
      res.send('Patched');
    })
    .catch((e: Error) => {
      res.status(500);
      res.send('Unknown error');
    });
};
