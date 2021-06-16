import { Request, Response } from 'express';

import LinkModel, { Link } from '../link/models';
import { saveVisitData } from './functions';

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
