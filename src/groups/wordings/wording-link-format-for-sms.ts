export const wordingLinkFormatForSms = (
  username: string,
  verificationLink: string,
): string => {
  const message = `Hai, ${username}!\n\nUntuk melakukan verifikasi, Klik link berikut: ${verificationLink} .\nJANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD.\nWASPADA PENIPUAN!
  `;
  return message;
};
