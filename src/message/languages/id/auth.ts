export default {
  login: {
    success: 'Login Success.',
    phoneNotFound: 'Phone Number not found in our system',
    passwordNotMatch: 'Your password not match',
    unactivedCashier: {
      code: 'CASHIER_NOT_INUSE',
      message: 'Cashier Sedang Tidak Bertugas.',
    },
    unactivedUser: {
      code: 'USER_NOT_ACTIVE',
      message: 'User Tidak Aktif.',
    },
    unfoundSpecialRole: {
      code: 'SPECIAL_ROLE_NOT_FOUND',
      message: 'Special Role tidak ditemukan.',
    },
  },
  basicToken: {
    success: 'Login Basci Token Success',
    test: 'Test Basic Token Success',
  },
  token: {
    invalid_token: {
      code: 'INVALID_TOKEN',
      message: 'Kode Token yang Anda masukan tidak valid.',
    },
    expired_token: {
      code: 'EXPIRED_TOKEN',
      message: 'Kode Token yang Anda masukan kadaluarsa.',
    },
    forbidden: {
      code: 'FORBIDDEN',
      message: 'Access Forbidden.',
    },
  },
};
