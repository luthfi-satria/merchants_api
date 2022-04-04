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
    validation_store_failed: {
      code: 'VALIDATION_STORE_BY_IDS_FAILED',
      message: 'Validasi toko gagal.',
    },
    fetch_special_role_code_failed: {
      code: 'FETCH_SPECIAL_ROLE_FAILED',
      message: 'Gagal mengambil data spesial role.',
    },
    fetch_store_users_failed: {
      code: 'FETCH_STORE_USERS_FAILED',
      message: 'Gagal mengambil data user toko.',
    },
    list_failed: {
      code: 'LIST_FAILED',
      message: 'Gagal mengambil data.',
    },
  },
};
