import { Request, Response } from 'express';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';

import LinkModel, { Link } from '../link/models';
import VisitModel, { Visit } from './models';

export const redirector = (req: Request, res: Response) => {
  const hash = req.params.hash;
  if (!hash || hash.length === 0) {
    res.status(400);
    return res.send('Bad Request');
  }
  LinkModel.findOne({ hash })
    .then((link: Link) => {
      if (!link) {
        res.status(404);
        return res.send('URL not found');
      }

      saveVisitData(req, link.id);

      res.set('Cache-Control', 'no-store');
      return res.redirect(301, link.url);
    })
    .catch((error: Error) => {
      res.status(500);
      res.send('Unknown error');
    });
};

const saveVisitData = (req: Request, lid: string) => {
  const ipAddress: string = req.socket.remoteAddress ?? '';
  const userAgent = req.headers['user-agent'] || '';
  const UA = UAParser(userAgent);
  const browser = UA.browser.name ?? 'Unknown';
  const os = UA.os.name ?? 'Unknown';
  const location = ipAddress.length > 0 ? geoip.lookup('172.62.12.10') : '';

  const visit = new VisitModel({
    lid,
    ipAddress,
    os,
    browser,
    location: getLocation(ipAddress),
  });
  visit.save();
};

const getLocation = (ipAddress: string) => {
  if (ipAddress.length === 0) return 'Unknown';
  const location: geoip.Lookup | null = geoip.lookup(ipAddress);

  if (!location) return 'Unknown';

  if (location.country) {
    if (location.city) {
      return `${location.city}/${location.country}`;
    } else return location.country;
  }
  return 'Unknown';
};
