import { randomBytes } from 'crypto';
import { FirebaseDynamicLinks } from 'firebase-dynamic-links';
import moment from 'moment';
import momenttz from 'moment-timezone';
import { extname } from 'path';

export function CreateRandomNumber(pjg: number): string {
  const random_number = parseInt(randomBytes(4).toString('hex'), 16).toString();
  if (pjg == 4) {
    return random_number.substring(random_number.length - 4);
  }
  return random_number.substring(random_number.length - 6);
}

export const excelFileFilter = (req: any, file: any, callback) => {
  if (!file.originalname.match(/\.(xlsx)$/)) {
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

export const editFileName = (req: any, file: any, callback: any) => {
  // const random_number = parseInt('0.' + randomBytes(8).toString('hex'), 16);
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  // const randomName = Array(4)
  //   .fill(null)
  //   .map(() => Math.round(random_number * 16).toString(16))
  //   .join('');
  const randomName = moment().format('x');
  // callback(null, `${name}-${randomName}${fileExtName}`);
  callback(null, `${randomName}-${name}${fileExtName}`);
};

export const imageJpgPngFileFilter = (req: any, file: any, callback) => {
  if (
    !file.originalname.match(/\.(jpg|jpeg|png)$/) &&
    !file.mimetype.includes('png') &&
    !file.mimetype.includes('jpg') &&
    !file.mimetype.includes('jpeg')
  ) {
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
  if (
    !file.originalname.match(/\.(jpg|jpeg|png|gif)$/) &&
    !file.mimetype.includes('png') &&
    !file.mimetype.includes('jpg') &&
    !file.mimetype.includes('jpeg') &&
    !file.mimetype.includes('gif')
  ) {
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
  if (
    !file.originalname.match(/\.(jpg|jpeg|png|pdf)$/) &&
    !file.mimetype.includes('png') &&
    !file.mimetype.includes('jpg') &&
    !file.mimetype.includes('jpeg') &&
    !file.mimetype.includes('pdf')
  ) {
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
    return process.env.BASEURL_API + '/api/v1/merchants/image' + filename;
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
  // delete input.approved_at;
  // delete input.created_at;
  // delete input.updated_at;
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
    if (key.endsWith('password')) {
      delete object[key];
    } else if (object[key] && typeof object[key] === 'object') {
      this.removeAllFieldPassword(object[key]);
    }
  }
};

const STYLE_HEADER =
  "font-weight:700;min-height: 10px;left: 0px;top: 40px;font-family: 'Lato';font-style: normal;font-size: 20px;line-height: 30px;font-feature-settings: 'pnum'on, 'lnum'on;color: #26272A;align-self: stretch;";
const CONTENT =
  "min-height: 10px;left: 0px;top: 40px;font-family: 'Lato';font-style: normal;font-size: 20px;line-height: 30px;font-feature-settings: 'pnum'on, 'lnum'on;color: #26272A;flex: none;order: 1;align-self: stretch;flex-grow: 0;";

export const generateMessageUrlVerification = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: process.env.SHORT_LINK_DOMAIN_URI_PREFIX,
      link,
    },
  });

  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Untuk verifikasi perubahan Email Anda klik link berikut: <a href="${shortLink}">${shortLink}</a> . </p>
  <p style="${CONTENT}"> JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  WASPADA PENIPUAN! </p>`;

  return message;
};

export const generateMessageChangeActiveEmail = (name: string): string => {
  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Alamat email Anda berhasil diperbaharui, Anda dapat login pada aplikasi eFOOD menggunakan email ini.</p>`;
  return message;
};

export const generateMessageRegistrationRejected = async (
  groupId: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);

  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: process.env.SHORT_LINK_DOMAIN_URI_PREFIX,
      link: `${process.env.SHORT_LINK_CORPORATE_REGISTER}?group_id=${groupId}`,
      androidInfo: {
        androidPackageName: process.env.SHORT_LINK_ANDROID_PACKAGE,
      },
    },
  });

  return `
    <p style="${STYLE_HEADER}">Dear eFOOD Partner.</p>
    <p style="${STYLE_HEADER}">Terima kasih atas ketertarikan Anda untuk bergabung dengan eFOOD!</p>
    <p style="${CONTENT}">
      Kami memberitahukan melalui email ini bahwa data yang telah diberikan belum lengkap sehingga kami belum bisa melanjutkan proses permintaan Anda sebagai eFOOD Partner.
      Kami menghimbau untuk melengkapi kembali persyaratan yang telah diinformasikan sebelumnya.
    </p>
    <p style="${CONTENT}">
      Anda bisa mencoba kembali untuk mengisi data sebagai calon eFOOD Partner.
      Mohon segera melakukan pengisian ulang data Anda agar dapat kami proses kembali untuk menjadi eFOOD Partner.
    </p>
    <p style="${CONTENT}">
      Proses pendaftaran eFOOD Partner GRATIS tidak dipungut biaya apapun.
    </p>
    <br>
    <p style="${CONTENT}">*Note : Silahkan lakukan pengisian data ulang melalui Link dibawah ini*</p>
    <p style="${CONTENT}"><a href="${shortLink}">${shortLink}</a> . </p>
    <br>
    <p style="${CONTENT}">Salam Hangat,</p>
    <br>
    <p style="${CONTENT}">eFOOD</p>
  `;
};

export const generateMessageRegistrationAccepted = (): string => {
  return `
    <p style="${STYLE_HEADER}">Dear eFOOD Partner,</p>
    <p style="${CONTENT}">Terima Kasih atas ketertarikan Anda untuk bergabung dengan eFOOD!</p>
    <p style="${CONTENT}">
        Kami memberitahukan melalui email ini bahwa akun merchant Anda akan segera aktif.
        Kami harap Anda dapat terus mengembangkan resto Anda lebih baik ke depannya bersama kami.
    </p>
    <p style="${CONTENT}">
        PERHATIAN proses pendaftaran eFOOD Partner GRATIS tidak dipungut biaya apapun.
        Hati-hati jika Anda menemukan beberapa oknum mengatasnamakan eFOOD dan meminta sejumlah uang yang dapat dipastikan penipuan.
        Jika Anda menemui hal tersebut, mohon segera hubungi pusat bantuan eFOOD.
    </p>
    <p style="${CONTENT}">Terima kasih dan keep healthy!</p>
    <br>
    <p style="${CONTENT}">Salam Hangat,</p>
    <p style="${CONTENT}">eFOOD</p>
  `;
};

export const generateMessageRegistrationInProgress = (): string => {
  return `
    <p style="${STYLE_HEADER}">Dear eFOOD Partner,</p>
    <p style="${CONTENT}">Terima Kasih atas ketertarikan Anda untuk bergabung dengan eFOOD!</p>
    <p style="${CONTENT}">
        Data Anda sudah kami terima dan data sedang dalam proses verifikasi tim kami yang membutuhkan waktu sekitar 1-7 hari kerja.
        Semua informasi terkait proses tersebut akan kami kirimkan melalui email.
        Pastikan alamat email yang Anda gunakan benar dan aktif.
        Mohon bersabar selama proses verifikasi berlangsung. Terima kasih!
    </p>
    <br>
    <p style="${CONTENT}">Salam Hangat,</p>
    <p style="${CONTENT}">eFOOD</p>
  `;
};

export const generateMessageResetPassword = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: process.env.SHORT_LINK_DOMAIN_URI_PREFIX,
      link,
    },
  });

  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Untuk mengubah Kata Sandi Anda, Klik link berikut: <a href="${shortLink}">${shortLink}</a> . </p>
  <p style="${CONTENT}"> JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  WASPADA PENIPUAN! </p>`;

  return message;
};

export const generateSmsUrlVerification = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: process.env.SHORT_LINK_DOMAIN_URI_PREFIX,
      link,
    },
  });
  const message = `Hai, ${
    name || 'User'
  }!\n\nUntuk verifikasi No HP Anda klik link berikut: ${shortLink} .\nJANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD.\nWASPADA PENIPUAN!
  `;
  return message;
};

export const generateSmsChangeActiveNoHp = (name: string): string => {
  const message = `Hai, ${
    name || 'User'
  }!\n\nNo HP Anda berhasil diperbaharui, Anda dapat login pada aplikasi eFOOD menggunakan No HP ini.!`;
  return message;
};

export const generateSmsResetPassword = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: process.env.SHORT_LINK_DOMAIN_URI_PREFIX,
      link,
    },
  });

  const message = `Hai, ${
    name || 'User'
  }!\n\nUntuk mengubah Kata Sandi Anda, Klik link berikut: ${shortLink} .\nJANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD.\nWASPADA PENIPUAN!`;
  return message;
};

export const cleanSearchString = (search: string): string => {
  if (!search) return search;
  return search.toLowerCase().replace(/\s\s+/g, ' ');
};
