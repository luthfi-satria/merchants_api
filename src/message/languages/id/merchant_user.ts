export default {
  delete: {
    success: 'Delete Merchant User Success.',
    fail: 'Delete Merchant User Gagal.',
    invalid_id: {
      code: 'INVALID_USER_ID',
      message: 'User ID tidak valid.',
    },
    self_delete: {
      code: 'CAN_NOT_DELETE_OWN_USER',
      message: 'Tidak dapat menghapus user sendiri',
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
    unauthorizedMultilevelLogin: {
      code: 'UNAUTHORIZED',
      message: 'User tidak memiliki hak akses Multilevel.',
    },
    idNotFound: {
      code: 'INVALID_ID',
      message: 'Merchant User ID tidak ditemukan.',
    },
  },
};
