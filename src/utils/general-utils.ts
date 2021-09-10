import { extname } from 'path';
import momenttz from 'moment-timezone';

export function CreateRandomNumber(pjg: number): string {
  if (pjg == 4) {
    const key: number = Math.floor(1000 + Math.random() * 9000);
    return key + '';
  }
  const key: number = Math.floor(100000 + Math.random() * 900000);
  return key + '';
}

export const editFileName = (req: any, file: any, callback: any) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const imageFileFilter = (req: any, file: any, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    if (!req.fileValidationError) {
      req.fileValidationError = [];
    }
    const error = {
      value: file.originalname,
      property: file.fieldname,
      constraint: 'file.image.not_allowed',
    };
    req.fileValidationError.push(error);
    callback(null, false);
  }
  callback(null, true);
};

export const dbOutputTime = function (input: Record<string, any>) {
  if (
    typeof input.approved_at != 'undefined' &&
    input.approved_at != null &&
    input.approved_at != 'undefined' &&
    input.approved_at != ''
  ) {
    input.approved_at = momenttz(input.approved_at)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  if (
    typeof input.deleted_at != 'undefined' &&
    input.deleted_at != null &&
    input.deleted_at != 'undefined' &&
    input.deleted_at != ''
  ) {
    input.deleted_at = momenttz(input.deleted_at)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  input.created_at = momenttz(input.created_at)
    .tz('Asia/Jakarta')
    .format('YYYY-MM-DD HH:mm:ss');
  input.updated_at = momenttz(input.updated_at)
    .tz('Asia/Jakarta')
    .format('YYYY-MM-DD HH:mm:ss');
  return input;
};

export const createUrl = function (filename: any) {
  if (typeof filename == 'undefined' || filename == null || filename == '') {
    return null;
  } else {
    return process.env.HTTP_ADDRESS + '/api/v1/merchants/image' + filename;
  }
};

export const getDistanceInKilometers = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // km
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const dLatRadian = (dLat * Math.PI) / 180;
  const dLonRadian = (dLon * Math.PI) / 180;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLatRadian / 2) * Math.sin(dLatRadian / 2) +
    Math.sin(dLonRadian / 2) *
      Math.sin(dLonRadian / 2) *
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};
