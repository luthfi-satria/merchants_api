export default {
  creategroup: {
    success: 'Create Corporate Success.',
    fail: 'Create Corporate Gagal.',
    phoneExist: 'Nomor telepon sudah digunakan oleh corporate lain',
    emailExist: 'Email sudah digunakan oleh corporate lain',
    invalid_token: 'Kode Token tidak valid.',
    empty_token: 'Kode Token tidak ada.',
    empty_photo: 'File photo kosong.',
  },
  updategroup: {
    success: 'Update Corporate Success.',
    fail: 'Update Corporate Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    unreg: 'ID corporate tidak valid.',
    empty_token: 'Kode Token tidak ada.',
  },
  deletegroup: {
    success: 'Delete Corporate Success.',
    fail: 'Delete Corporate Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    invalid_id: 'ID tidak valid.',
    merchant_active: 'Merchant masih aktif.',
  },
  listgroup: {
    success: 'Get List Corporate Success.',
    fail: 'Get List Corporate Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    query_fail: 'Akses ke database gagal',
  },
  logingroup: {
    success: 'Login Corporate Success.',
    fail: 'Login Corporate Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    query_fail: 'Akses ke database gagal',
    invalid_email: 'Email atau password corporate tidak valid.',
    invalid_phone: 'Nomor Telepon atau password corporate tidak valid.',
    invalid_password: 'Email atau password corporate tidak valid.',
  },
  createmerchant: {
    success: 'Create Brand Success.',
    fail: 'Create Brand Gagal.',
    phoneExist: 'Nomor telepon sudah digunakan oleh brand lain',
    emailExist: 'Email sudah digunakan oleh brand lain.',
    empty_token: 'Kode Token tidak ada.',
    invalid_token: 'Kode Token tidak valid.',
    groupid_notfound: 'ID corporate tidak ditemukan.',
    lobid_notfound: 'ID bidang usaha tidak ditemukan.',
    bankid_notfound: 'ID Bank tidak ditemukan.',
    empty_photo: 'File photo kosong.',
    groupid_notactive: 'ID corporate tidak aktif',
  },
  updatemerchant: {
    success: 'Update Brand Success.',
    fail: 'Update Brand Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
    unreg: 'ID Brand tidak valid.',
  },
  deletemerchant: {
    success: 'Delete Brand Success.',
    fail: 'Delete Brand Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    invalid_id: 'ID tidak valid.',
  },
  listmerchant: {
    success: 'Get List Brand Success.',
    fail: 'Get List Brand Gagal.',
    phoneUnreg: 'Nomor Telepon Pemilik tidak terdaftar',
    empty_token: 'Kode Token tidak ada.',
  },
  loginmerchant: {
    success: 'Login Brand Success.',
    fail: 'Login Brand Gagal.',
    phoneUnreg: 'Nomor Telepon Brand tidak terdaftar',
    empty_token: 'Kode Token Brand tidak ada.',
    query_fail: 'Akses ke database gagal',
    invalid_email: 'Email atau password brand tidak valid.',
    invalid_phone: 'Nomor Telepon atau password brand tidak valid.',
    invalid_password: 'Email atau password brand tidak valid.',
  },
  createstore: {
    success: 'Create Store Success.',
    fail: 'Create Store Gagal.',
    phoneExist: 'Nomor telepon sudah digunakan oleh store lain',
    emailExist: 'Email sudah digunakan oleh store lain.',
    empty_token: 'Kode Token tidak ada.',
    merchantid_notfound: 'ID Brand tidak ditemukan.',
    merchantid_notactive: 'ID Brand tidak aktif',
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
  },
  loginstore: {
    success: 'Login Store Success.',
    fail: 'Login Store Gagal.',
    phoneUnreg: 'Nomor Telepon Store tidak terdaftar',
    empty_token: 'Kode Token Store tidak ada.',
    query_fail: 'Akses ke database gagal',
    invalid_email: 'Email atau password Store tidak valid.',
    invalid_phone: 'Nomor Telepon atau password Store tidak valid.',
    invalid_password: 'Email atau password Store tidak valid.',
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
};
