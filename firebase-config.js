(() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbw64ts9jxaM85iUf1lbnXQYCh7_3CpWuJiaTCSKOaHFGWlorQ_IQ-ZzSno3te91XoDvFw/exec';
  const KEY = 'ekinerja_token';
  const HALAMAN = { admin: 'dashboard.html', pegawai: 'index.html' };
  const keLogin = () => location.replace('login.html');

  async function panggil(aksi, data = {}) {
    if (API_URL.startsWith('GANTI')) throw new Error('URL Apps Script belum diisi di api.js');
    let res;
    try {
      res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ aksi, token: localStorage.getItem(KEY) || '', ...data }) });
    } catch (e) { throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.'); }
    const j = await res.json().catch(() => null);
    if (!j) throw new Error('Respons server tidak valid. Pastikan deploy Apps Script: akses "Anyone".');
    if (!j.ok) {
      const e = new Error(j.error || 'Gagal'); e.kode = j.kode;
      if (j.kode === 'AUTH') { localStorage.removeItem(KEY); if (aksi !== 'me') setTimeout(keLogin, 1500); }
      throw e;
    }
    return j.data;
  }

  window.keluar = () => { localStorage.removeItem(KEY); keLogin(); };
  window.ekHalaman = role => HALAMAN[role] || 'index.html';
  window.ekLogin = async (username, password) => {
    const r = await panggil('login', { username, password });
    localStorage.setItem(KEY, r.token);
    return r.user;
  };
  window.ekSesi = async () => {
    if (!localStorage.getItem(KEY)) return null;
    try { return await panggil('me'); } catch (e) { if (e.kode === 'AUTH') return null; throw e; }
  };

  window.ekDb = {
    kegiatanSaya: () => panggil('kegiatanSaya'),
    kegiatanBulan: b => panggil('kegiatanBulan', { bulan: b }),
    users: () => panggil('users'),
    simpan: (uid, nama, d) => panggil('simpan', { data: d }),
    hapus: (uid, id) => panggil('hapus', { id })
  };

  window.mulaiAuth = (perlu, onReady) => {
    const ov = document.createElement('div');
    ov.className = 'fixed inset-0 z-[100] bg-indigo-950 flex items-center justify-center p-4';
    document.body.appendChild(ov);
    const cek = () => {
      ov.innerHTML = '<p class="text-sm text-indigo-100"><i class="fa-solid fa-spinner fa-spin"></i> Memeriksa sesi...</p>';
      if (!localStorage.getItem(KEY)) { keLogin(); return; }
      panggil('me').then(u => {
        if (u.role !== perlu) { location.replace(window.ekHalaman(u.role)); return; }
        ov.remove(); onReady(u);
      }).catch(e => {
        if (e.kode === 'AUTH') { keLogin(); return; }
        ov.innerHTML = '<div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-3">' +
          '<p class="text-sm text-slate-700"></p>' +
          '<button id="ekUlang" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg">Coba lagi</button>' +
          '<button id="ekLogin" class="underline text-xs text-slate-500">Ke halaman login</button></div>';
        ov.querySelector('p').textContent = e.message;
        ov.querySelector('#ekUlang').onclick = cek;
        ov.querySelector('#ekLogin').onclick = window.keluar;
      });
    };
    cek();
  };
})();
