export function parseUserFriendlyError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba beberapa saat lagi.';

  const message = typeof error === 'string' ? error : (error.message || error.error_description || JSON.stringify(error));

  if (message.includes('FORM_CLOSED')) {
    return 'Form penentuan piket saat ini telah ditutup oleh panitia.';
  }

  if (message.includes('FORM_MAINTENANCE')) {
    return 'Sistem sedang dalam pemeliharaan berkala. Silakan coba kembali beberapa saat lagi.';
  }

  if (message.includes('NO_GURU_SELECTED')) {
    return 'Anda belum memilih guru untuk penetapan piket kamar ini.';
  }

  if (message.includes('LIMIT_EXCEEDED')) {
    return 'Penetapan tidak dapat disimpan karena jumlah guru yang dipilih melebihi batas kuota limit piket kamar ini.';
  }

  if (message.includes('INVALID_GURU_SELECTION')) {
    return 'Satu atau lebih guru yang dipilih tidak terdaftar pada kamar ini atau sudah dinonaktifkan.';
  }

  if (message.includes('GURU_ALREADY_ASSIGNED')) {
    return 'Salah satu guru yang Anda pilih sudah ditetapkan sebagai piket aktif pada kamar lain/sebelumnya.';
  }

  if (message.includes('KAMAR_INACTIVE')) {
    return 'Kamar ini berstatus nonaktif dan tidak dapat menerima penetapan piket.';
  }

  if (message.includes('KAMAR_NOT_FOUND')) {
    return 'Data kamar tidak ditemukan dalam sistem.';
  }

  if (message.includes('23505') || message.includes('duplicate key')) {
    return 'Penetapan kamar baru saja diperbarui oleh pengguna lain. Data telah diperbarui, silakan muat ulang halaman.';
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet lalu coba lagi.';
  }

  return message.replace(/^[A-Z_]+:\s*/, '');
}
