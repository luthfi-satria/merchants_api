import { extname } from 'path';
import momenttz from 'moment-timezone';
import { randomBytes } from 'crypto';

export function CreateRandomNumber(pjg: number): string {
  const random_number = parseInt(randomBytes(4).toString('hex'), 16).toString();
  if (pjg == 4) {
    return random_number.substring(random_number.length - 4);
  }
  return random_number.substring(random_number.length - 6);
}

export const editFileName = (req: any, file: any, callback: any) => {
  const random_number = parseInt('0.' + randomBytes(8).toString('hex'), 16);
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(random_number * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const imageJpgPngFileFilter = (req: any, file: any, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
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

export const imageAndPdfFileFilter = (req: any, file: any, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
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
  // if (
  //   typeof input.approved_at != 'undefined' &&
  //   input.approved_at != null &&
  //   input.approved_at != 'undefined' &&
  //   input.approved_at != ''
  // ) {
  //   input.approved_at = momenttz(input.approved_at)
  //     .tz('Asia/Jakarta')
  //     .format('YYYY-MM-DD HH:mm:ss');
  // }
  // if (
  //   typeof input.deleted_at != 'undefined' &&
  //   input.deleted_at != null &&
  //   input.deleted_at != 'undefined' &&
  //   input.deleted_at != ''
  // ) {
  //   input.deleted_at = momenttz(input.deleted_at)
  //     .tz('Asia/Jakarta')
  //     .format('YYYY-MM-DD HH:mm:ss');
  // }
  if (input.created_at) {
    input.created_at = momenttz(input.created_at)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  if (input.approved_at && input.approved_at != null) {
    input.approved_at = momenttz(input.approved_at)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');
  }
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

export const deleteCredParam = function (input: Record<string, any>) {
  delete input.approved_at;
  delete input.created_at;
  delete input.updated_at;
  delete input.deleted_at;
  delete input.director_password;
  delete input.password;
  delete input.owner_password;
  delete input.pic_password;
  delete input.pic_finance_password;
  delete input.pic_operational_password;
  // delete input.token_reset_password;
  return input;
};

export const delParamNoActiveUpdate = function (input: Record<string, any>) {
  delete input.updated_at;
  delete input.deleted_at;
  delete input.director_password;
  delete input.password;
  delete input.owner_password;
  delete input.pic_password;
  delete input.pic_finance_password;
  delete input.pic_operational_password;
  return input;
};

export const delExcludeParam = function (input: Record<string, any>) {
  delete input.updated_at;
  delete input.deleted_at;
  delete input.director_password;
  delete input.password;
  delete input.owner_password;
  delete input.pic_password;
  delete input.pic_finance_password;
  delete input.pic_operational_password;
  dbOutputTime(input);
  return input;
};

export const formatingOutputTime = function formatingOutputTime(time: string) {
  return momenttz(time).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
};

export const formatingAllOutputTime = function formatingAllOutputTime(
  object: any,
) {
  for (const key in object) {
    if (object[key] && key.endsWith('_at')) {
      object[key] = this.formatingOutputTime(object[key]);
    }
    if (object[key] && typeof object[key] === 'object') {
      this.formatingAllOutputTime(object[key]);
    }
  }
};

export const removeAllFieldPassword = function removeAllFieldPassword(
  object: any,
) {
  for (const key in object) {
    console.log(key + ' : ' + object[key] + ' << in');
    if (key.endsWith('password')) {
      console.log(key+' >> has deleted');
      delete object[key];
    } else if (object[key] && typeof object[key] === 'object') {
      this.removeAllFieldPassword(object[key]);
    }
  }
};
