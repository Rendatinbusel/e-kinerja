// Isi dengan konfigurasi dari Firebase Console > Project settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyBnffKdt4p-g23FOA5pLOTKXNnf6KSLq6c",
  authDomain: "e-kinerja-32de9.firebaseapp.com",
  projectId: "e-kinerja-32de9",
  appId: "1:806499601727:web:47ffec80c784880ef8978a"
};
const DOMAIN_USER = '@ekinerja.local'; // username "andi" => akun Firebase "andi@ekinerja.local"

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), fs = firebase.firestore();

function keluar() { auth.signOut().then(() => location.reload()); }

// perlu: 'pegawai' (halaman input) atau 'admin' (dashboard). onReady({uid, nama, role}) dipanggil setelah login sesuai.
function mulaiAuth(perlu, onReady) {
  const ov = document.createElement('div');
  ov.className = 'fixed inset-0 z-[100] bg-indigo-950/95 flex items-center justify-center p-4';
  ov.innerHTML = `<form id="ekLogin" class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-3">
    <div><h2 class="font-bold text-lg text-slate-800">${perlu === 'admin' ? 'Masuk sebagai admin' : 'Masuk e-Kinerja'}</h2>
    <p class="text-xs text-slate-500">KPU Kabupaten Buton Selatan</p></div>
    <input id="ekUser" required placeholder="Username" autocomplete="username" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
    <input id="ekPass" type="password" required placeholder="Password" autocomplete="current-password" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
    <p id="ekErr" class="text-xs text-rose-600 hidden"></p>
    <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg">Masuk</button>
  </form>`;
  document.body.appendChild(ov);
  const err = t => { const e = document.getElementById('ekErr'); e.innerText = t; e.classList.toggle('hidden', !t); };

  ov.querySelector('#ekLogin').onsubmit = ev => {
    ev.preventDefault(); err('');
    const u = document.getElementById('ekUser').value.trim().toLowerCase().replace(/\s+/g, '');
    auth.signInWithEmailAndPassword(u + DOMAIN_USER, document.getElementById('ekPass').value)
      .catch(() => err('Username atau password salah.'));
  };

  auth.onAuthStateChanged(async u => {
    if (!u) { ov.classList.remove('hidden'); return; }
    let profil = {};
    try { const d = await fs.doc('users/' + u.uid).get(); if (d.exists) profil = d.data(); } catch (e) {}
    const role = profil.role === 'admin' ? 'admin' : 'pegawai';
    if (role !== perlu) { location.href = role === 'admin' ? 'dashboard.html' : 'index.html'; return; }
    ov.classList.add('hidden');
    onReady({ uid: u.uid, nama: profil.nama || u.email.split('@')[0], role });
  });
}