export default {
  general: {
    success: 'SUCCESS',
    empty_token: 'Kode Token tidak ada.',
    invalid_token: 'Kode Token tidak valid.',
    empty_photo: {
      code: 'IMAGE_NOT_FOUND',
      message: 'File image kosong.',
    },
    idNotFound: {
      code: 'INVALID_ID',
      message: 'ID tidak ditemukan.',
    },
    invalidID: {
      code: 'INVALID_ID',
      message: 'ID tidak valid.',
    },
    invalidUUID: {
      code: 'INVALID_UUID',
      message: 'UUID tidak valid.',
    },
    storeIdNotMatch: {
      code: 'STORE_ID_NOT_MATCH',
      message: 'Store ID bukan milik merchant.',
    },
  },
  creategroup: {
    success: 'SUCCESS',
    fail: 'Create Group Gagal.',
    phoneExist: 'Nomor telepon sudah digunakan oleh Group lain',
    emailExist: 'Email sudah digunakan oleh Group lain',
    invalid_token: 'Kode Token tidak valid.',
    empty_token: 'Kode Token tidak ada.',
    empty_photo: 'File photo kosong.',
  },
  updategroup: {
    success: 'Update Group Success.',
    fail: 'Update Group Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    unreg: 'ID Group tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  deletegroup: {
    success: 'Delete Group Success.',
    fail: 'Delete Group Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    invalid_id: 'ID tidak valid.',
    merchant_active: 'Merchant masih aktif.',
  },
  listgroup: {
    success: 'Get List Group Success.',
    fail: 'Get List Group Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    query_fail: 'Akses ke database gagal',
  },
  createmerchant: {
    success: 'Create Merchant Success.',
    fail: 'Create Merchant Gagal.',
    phoneExist: {
      code: 'PHONE_ALREADY_REGISTERED',
      message: 'Nomor telepon sudah digunakan oleh Merchant lain',
    },
    emailExist: 'Email sudah digunakan oleh Merchant lain.',
    empty_token: 'Kode Token tidak ada.',
    invalid_token: 'Kode Token tidak valid.',
    groupid_notfound: 'ID Group tidak ditemukan.',
    lobid_notfound: 'ID bidang usaha tidak ditemukan.',
    bankid_notfound: 'ID Bank tidak ditemukan.',
    empty_photo: 'File photo kosong.',
    groupid_notactive: 'ID Group tidak aktif',
  },
  updatemerchant: {
    success: 'Update Merchant Success.',
    fail: 'Update Merchant Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    unreg: 'ID Merchant tidak valid.',
  },
  deletemerchant: {
    success: 'Delete Merchant Success.',
    fail: 'Delete Merchant Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    invalid_id: 'ID tidak valid.',
  },
  listmerchant: {
    success: 'Get List Merchant Success.',
    fail: 'Get List Merchant Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
  },
  createstore: {
    success: 'Create Store Success.',
    fail: 'Create Store Gagal.',
    phoneExist: 'Nomor telepon sudah digunakan oleh store lain',
    emailExist: 'Email sudah digunakan oleh store lain.',
    empty_token: 'Kode Token tidak ada.',
    merchantid_notfound: 'ID Merchant tidak ditemukan.',
    merchantid_notactive: 'ID Merchant tidak aktif',
    empty_photo: 'File photo kosong.',
    addonid_unreg: 'ID Addon tidak terdaftar.',
  },
  updatestore: {
    success: 'Update Store Success.',
    fail: 'Update Store Gagal.',
    unreg: 'Nomor Telepon Pemilik tidak terdaftar',
    id_notfound: 'ID Store tidak ditemukan',
    empty_token: 'Kode Token tidak ada.',
  },
  deletestore: {
    success: 'Delete Store Success.',
    fail: 'Delete Store Gagal.',
    unreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    invalid_id: 'ID tidak valid.',
  },
  liststore: {
    success: 'Get List Store Success.',
    fail: 'Get List Store Gagal.',
    unreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    not_found: {
      code: 'ISEMPTY',
      message: 'Store tidak ditemukan',
    },
  },
  createlob: {
    success: 'Create Bidang Usaha Success.',
    fail: 'Create Bidang Usaha Gagal.',
    nameExist: 'Nama Bidang Usaha sudah digunakan',
    invalid_token: 'Kode Token tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  updatelob: {
    success: 'Update Bidang Usaha Success.',
    fail: 'Update Bidang Usaha Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    unreg: 'ID Bidang Usaha tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  deletelob: {
    success: 'Delete Bidang Usaha Success.',
    fail: 'Delete Bidang Usaha Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    invalid_id: 'ID tidak valid.',
  },
  listlob: {
    success: 'Get List Bidang Usaha Success.',
    fail: 'Get List Bidang Usaha Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
  },
  listbank: {
    success: 'Get List Bank Success.',
    fail: 'Get List Bank Gagal.',
  },
  createaddon: {
    success: 'Create Addon Success.',
    fail: 'Create Addon Gagal.',
    nameExist: 'Nama Addon sudah digunakan',
    invalid_token: 'Kode Token tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  updateaddon: {
    success: 'Update Addon Success.',
    fail: 'Update Addon Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    unreg: 'ID Addon tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  deleteaddon: {
    success: 'Delete Addon Success.',
    fail: 'Delete Addon Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    invalid_id: 'ID tidak valid.',
  },
  listaddon: {
    success: 'Get List Addon Success.',
    fail: 'Get List Addon Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
  },
  login: {
    success: 'Login Success.',
    fail: 'Login Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    query_fail: 'Akses ke database gagal',
    invalid_email: 'Email tidak valid.',
    invalid_phone: 'Nomor Telepon tidak valid.',
    invalid_password: 'Email atau password tidak valid.',
    unregistered_phone: {
      code: 'UNREGISTERED_PHONE',
      message: 'No. handphone belum terdaftar. Daftar sebagai member?',
    },
    unregistered_email: {
      code: 'UNREGISTERED_EMAIL',
      message: 'Email belum terdaftar. Daftar sebagai member?',
    },
  },
  user: {
    success: 'Ambil data Sukses.',
    unregistered_user: {
      code: 'UNREGISTERED_USER',
      message: 'User belum terdaftar.',
    },
  },
};
