export default {
  delete: {
    success: 'Delete Merchant User Success.',
    fail: 'Delete Merchant User Gagal.',
    invalid_id: {
      code: 'INVALID_USER_ID',
      message: 'User ID tidak valid.',
    },
  },
  general: {
    forbidden: {
      code: 'FORBIDDEN',
      message: 'User hanya boleh mengubah data milik group nya saja.',
    },
    store_not_owned_merchant_nor_user: {
      code: 'STORE_NOT_OWNED',
      message:
        'Store tidak di miliki oleh merchant atau tidak di miliki oleh user. ',
    },
  },
};
