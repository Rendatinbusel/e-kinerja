(() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbw64ts9jxaM85iUf1lbnXQYCh7_3CpWuJiaTCSKOaHFGWlorQ_IQ-ZzSno3te91XoDvFw/exec';
  const KEY = 'ekinerja_token';

  async function panggil(aksi, data = {}) {
    if (API_URL.startsWith('GANTI')) throw new Error('URL Apps Script belum diisi di api.js');
    let res;
    try {
      res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ aksi, token: localStorage.getItem(KEY) || '', ...data }) });
    } catch (e) { throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.'); }
    const j = await res.json().catch(() => null);
    if (!j) throw new Error('Respons server tidak valid. Pastikan deploy Apps Script: akses "Anyone".');
    if (!j.ok) { if (j.kode === 'AUTH') localStorage.removeItem(KEY); const e = new Error(j.error || 'Gagal'); e.kode = j.kode; throw e; }
    return j.data;
  }

  window.keluar = () => { localStorage.removeItem(KEY); location.reload(); };

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
    ov.innerHTML = `<form class="hidden bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-3">
      <div><h2 class="font-bold text-lg text-slate-800">${perlu === 'admin' ? 'Masuk sebagai admin' : 'Masuk e-Kinerja'}</h2>
      <p class="text-xs text-slate-500">KPU Kabupaten Buton Selatan</p></div>
      <input id="ekUser" required placeholder="Username" autocomplete="username" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
      <input id="ekPass" type="password" required placeholder="Password" autocomplete="current-password" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
      <p id="ekErr" class="text-xs text-rose-600 hidden"></p>
      <button id="ekBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg">Masuk</button>
    </form>`;
    document.body.appendChild(ov);
    const form = ov.firstElementChild, errEl = ov.querySelector('#ekErr'), btn = ov.querySelector('#ekBtn');
    const err = t => { errEl.innerText = t; errEl.classList.toggle('hidden', !t); };

    const lanjut = u => {
      if (u.role !== perlu) { location.href = u.role === 'admin' ? 'dashboard.html' : 'index.html'; return; }
      ov.remove(); onReady(u);
    };

    form.onsubmit = async ev => {
      ev.preventDefault(); err(''); btn.disabled = true; btn.innerText = 'Memeriksa...';
      try {
        const r = await panggil('login', { username: ov.querySelector('#ekUser').value, password: ov.querySelector('#ekPass').value });
        localStorage.setItem(KEY, r.token); lanjut(r.user);
      } catch (e) { err(e.message); }
      btn.disabled = false; btn.innerText = 'Masuk';
    };

    if (localStorage.getItem(KEY)) panggil('me').then(lanjut).catch(e => { form.classList.remove('hidden'); if (e.kode !== 'AUTH') err(e.message); });
    else form.classList.remove('hidden');
  };
})();
