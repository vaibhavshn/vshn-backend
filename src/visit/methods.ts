import { Request } from 'express';
import UAParser from 'ua-parser-js';
import { fetch as fetchLocation } from 'ip-to-location';
import VisitModel from './models';

export const saveVisitData = async (req: Request, lid: string) => {
  const ipAddress: string = req.socket.remoteAddress ?? '';
  const userAgent = req.headers['user-agent'] || '';
  const { browser, os } = getUAData(userAgent);
  const location = await getLocation(ipAddress);

  const visit = new VisitModel({
    lid,
    ipAddress,
    os,
    browser,
    location,
  });
  visit.save();
};

const getUAData = (ua: string): Record<string, string> => {
  const UA = UAParser(ua);
  const browser = UA.browser.name ?? 'Unknown';
  const os = UA.os.name ?? 'Unknown';
  return {
    browser,
    os,
  };
};

const getLocation = async (ipAddress: string) => {
  if (ipAddress === '') return 'Unknown';
  const location = await fetchLocation(ipAddress);
  if (!location || location.status === false) {
    return 'Unknown';
  }
  return `${location.region_name}/${location.country_name}`;
};
