import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { pick } from 'lodash';

import LinkModel, { Link } from './models';
import {
  addRandomHashLink,
  getLinkWithStats,
  getValidURL,
  linkAdder,
} from './methods';

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

    const hash: string = linkData.hash.trim();

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
          res.status(500);
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
      getLinkWithStats(res, link, user.id);
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
        total: totalCount,
        pages,
      });
    })
    .catch((error: Error) => {
      res.status(500);
      res.send('Unknown error');
    });
};

export const getStats = (req: Request, res: Response) => {
  const { user } = res.locals;
  if (!user) {
    res.status(401);
    return res.send();
  }
  LinkModel.aggregate([
    {
      $match: { uid: user.id },
    },
    {
      $lookup: {
        from: 'visits',
        localField: '_id',
        foreignField: 'lid',
        as: 'visits',
      },
    },
    {
      $project: {
        hash: 1,
        count: { $size: '$visits' },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
      },
    },
  ])
    .then((stats) => {
      res.status(200);
      res.json({
        totalViews: stats.length === 0 ? 0 : stats[0].total,
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

export const patchLink = (req: Request, res: Response) => {
  const { user } = res.locals;
  if (!user) {
    res.status(401);
    return res.send();
  }

  const hash = req.params.hash.trim();

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
