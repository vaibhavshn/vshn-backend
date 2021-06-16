import { Response } from 'express';
import { pick } from 'lodash';

import { getRandomHash } from '../utils/hash';
import LinkModel, { Link } from './models';
import VisitModel from '../visit/models';

export const addRandomHashLink = (
  uid: string,
  url: string,
  res: Response,
  iteration: number
) => {
  if (iteration > 5) {
    res.status(500);
    return res.send('Unknown error');
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

export const linkAdder = (uid: string, url: string, hash: string) => {
  // prepend https:// if url doesn't start with https?://
  const link = new LinkModel({
    uid,
    hash,
    url: !/^https?:\/\//.test(url) ? `https://${url}` : url,
  });
  return link.save();
};

export const getValidURL = (url: string): string => {
  if (!/^https?:\/\//.test(url)) {
    return `https://${url}`;
  }
  return url;
};

export const getLinkWithStats = (res: Response, link: Link, userId: string) => {
  const promises = Promise.all([
    VisitModel.aggregate([
      {
        $match: {
          lid: link._id,
        },
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),

    // Get total views
    LinkModel.aggregate([
      {
        $match: { hash: link.hash, uid: userId },
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
    ]),

    // Get browser stats
    VisitModel.aggregate([
      {
        $match: {
          lid: link._id,
        },
      },
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
        $match: {
          lid: link._id,
        },
      },
      {
        $group: {
          _id: '$os',
          count: { $sum: 1 },
        },
      },
    ]),

    // Get location data
    VisitModel.aggregate([
      {
        $match: { lid: link._id },
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  promises
    .then(
      ([
        uniqueViews,
        totalViews,
        browserResults,
        osResults,
        locationResults,
      ]) => {
        const browsers: Record<string, number> = {},
          os: Record<string, number> = {},
          locations: Record<string, number> = {};

        for (const row of browserResults) {
          browsers[row._id] = row.count;
        }

        for (const row of osResults) {
          os[row._id] = row.count;
        }

        for (const row of locationResults) {
          locations[row._id] = row.count;
        }

        res.status(200);
        res.json({
          ...pick(link, ['url', 'createdAt']),
          uniqueViews: uniqueViews.length === 0 ? 0 : uniqueViews[0].total,
          totalViews: totalViews.length === 0 ? 0 : totalViews[0].total,
          browsers,
          os,
          locations,
        });
      }
    )
    .catch((err: Error) => {
      res.status(500);
      res.send('Unknown error');
    });
};
