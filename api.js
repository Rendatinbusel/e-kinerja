(() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbw64ts9jxaM85iUf1lbnXQYCh7_3CpWuJiaTCSKOaHFGWlorQ_IQ-ZzSno3te91XoDvFw/exec';
  const KEY = 'ekinerja_token', CKEY = 'ekinerja_cache';
  const HALAMAN = { admin: 'dashboard.html', pegawai: 'index.html' };
  const keLogin = () => location.replace('login.html');
  const bersihkan = () => { localStorage.removeItem(KEY); localStorage.removeItem(CKEY); };
  const bacaCache = () => { try { return JSON.parse(localStorage.getItem(CKEY)) || null; } catch (e) { return null; } };
  const tulisCache = o => { try { localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) {} };

  async function panggil(aksi, data = {}) {
    if (API_URL.startsWith('GANTI')) throw new Error('URL Apps Script belum diisi di api.js');
    const body = JSON.stringify({ aksi, token: localStorage.getItem(KEY) || '', ...data });
    let j = null, jenis = '';
    // Apps Script sesekali membalas halaman error sementara dari Google (bukan JSON).
    // Semua aksi aman diulang (simpan/hapus memakai ID), jadi coba hingga 3 kali.
    for (let i = 0; i < 3 && !j; i++) {
      if (i) await new Promise(r => setTimeout(r, 800 * i));
      try {
        const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body });
        const t = await res.text();
        try { j = JSON.parse(t); } catch (e) { jenis = 'respons'; console.warn('e-Kinerja: respons bukan JSON', res.status, t.slice(0, 300)); }
      } catch (e) { jenis = 'jaringan'; }
    }
    if (!j) throw new Error(jenis === 'jaringan' ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.' : 'Server Google sedang sibuk atau terlambat merespons. Coba lagi sebentar.');
    if (!j.ok) {
      const e = new Error(j.error || 'Gagal'); e.kode = j.kode;
      if (j.kode === 'AUTH') { bersihkan(); if (aksi !== 'me' && aksi !== 'mulai') setTimeout(keLogin, 1500); }
      throw e;
    }
    return j.data;
  }

  window.keluar = () => { bersihkan(); keLogin(); };
  window.ekHalaman = role => HALAMAN[role] || 'index.html';
  window.ekPanaskan = () => { panggil('ping').catch(() => {}); };   // bangunkan server Apps Script selagi pengguna mengetik
  window.ekAdaSesi = () => { const c = bacaCache(); return localStorage.getItem(KEY) && c && c.role ? c.role : null; };
  window.ekLogin = async (username, password) => {
    const r = await panggil('login', { username, password });
    bersihkan();
    localStorage.setItem(KEY, r.token);
    return r.user;
  };
  window.ekSesi = async () => {
    if (!localStorage.getItem(KEY)) return null;
    try { return await panggil('me'); } catch (e) { if (e.kode === 'AUTH') return null; throw e; }
  };
  window.ekSimpanCache = kegiatan => { const c = bacaCache(); if (c && c.data) { c.data.kegiatan = kegiatan; tulisCache(c); } };

  window.ekDb = {
    kegiatanSaya: () => panggil('kegiatanSaya'),
    kegiatanBulan: b => panggil('kegiatanBulan', { bulan: b }),
    users: () => panggil('users'),
    simpan: (uid, nama, d) => panggil('simpan', { data: d }),
    hapus: (uid, id) => panggil('hapus', { id })
  };

  const toast = t => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#1e1b4b;color:#fff;font-size:12px;padding:10px 14px;border-radius:8px;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 5000);
  };

  // onReady(user, data, segar): dipanggil dua kali bila ada cache -
  // pertama langsung dari cache (segar=false), lalu dari server (segar=true).
  window.mulaiAuth = (perlu, onReady, getBulan) => {
    if (!localStorage.getItem(KEY)) { keLogin(); return; }
    const bulan = () => (getBulan ? String(getBulan() || '') : '');
    const c = bacaCache();
    const adaCache = !!(c && c.role === perlu && c.bulan === bulan() && c.data);
    let ov = null;
    if (adaCache) onReady(c.user, c.data, false);
    else { ov = document.createElement('div'); ov.className = 'fixed inset-0 z-[100] bg-indigo-950 flex items-center justify-center p-4'; document.body.appendChild(ov); }

    const muat = () => {
      if (ov) ov.innerHTML = '<p class="text-sm text-indigo-100"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</p>';
      const b = bulan();
      panggil('mulai', { bulan: b }).then(r => {
        if (r.user.role !== perlu) { location.replace(window.ekHalaman(r.user.role)); return; }
        const data = { kegiatan: r.kegiatan || [], users: r.users || [], bulan: b };
        tulisCache({ user: r.user, role: r.user.role, bulan: b, data });
        if (ov) { ov.remove(); ov = null; }
        onReady(r.user, data, true);
      }).catch(e => {
        if (e.kode === 'AUTH') { keLogin(); return; }
        if (!ov) { toast('Gagal menyegarkan data: ' + e.message); return; }
        ov.innerHTML = '<div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-3">' +
          '<p class="text-sm text-slate-700"></p>' +
          '<button id="ekUlang" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg">Coba lagi</button>' +
          '<button id="ekLogin" class="underline text-xs text-slate-500">Ke halaman login</button></div>';
        ov.querySelector('p').textContent = e.message;
        ov.querySelector('#ekUlang').onclick = muat;
        ov.querySelector('#ekLogin').onclick = window.keluar;
      });
    };
    muat();
  };
})();
