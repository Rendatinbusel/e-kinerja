import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-lite.js';

const firebaseConfig = {
  apiKey: "AIzaSyBnffKdt4p-g23FOA5pLOTKXNnf6KSLq6c",
  authDomain: "e-kinerja-32de9.firebaseapp.com",
  projectId: "e-kinerja-32de9",
  appId: "1:806499601727:web:47ffec80c784880ef8978a"
};
const DOMAIN_USER = '@ekinerja.local'; // username "andi" => akun Firebase "andi@ekinerja.local"

const app = initializeApp(firebaseConfig), auth = getAuth(app), fs = getFirestore(app);
const isi = s => s.docs.map(d => d.data());
const kol = collection(fs, 'kegiatan');

window.keluar = () => signOut(auth).then(() => location.reload());

// Akses data (Firestore Lite: ringan, tanpa koneksi realtime)
window.ekDb = {
  kegiatanSaya: uid => getDocs(query(kol, where('uid', '==', uid))).then(isi),
  kegiatanBulan: b => getDocs(query(kol, where('tanggal', '>=', `2026-${b}-01`), where('tanggal', '<=', `2026-${b}-31`))).then(isi),
  users: () => getDocs(collection(fs, 'users')).then(isi),
  simpan: (uid, nama, d) => setDoc(doc(fs, 'kegiatan', `${uid}_${d.id}`), { ...d, uid, pegawai: nama }),
  hapus: (uid, id) => deleteDoc(doc(fs, 'kegiatan', `${uid}_${id}`))
};

// perlu: 'pegawai' (halaman input) atau 'admin' (dashboard). onReady({uid, nama, role}) dipanggil setelah login sesuai.
window.mulaiAuth = (perlu, onReady) => {
  const ov = document.createElement('div');
  ov.className = 'fixed inset-0 z-[100] bg-indigo-950 flex items-center justify-center p-4';
  ov.innerHTML = `<form class="hidden bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-3">
    <div><h2 class="font-bold text-lg text-slate-800">${perlu === 'admin' ? 'Masuk sebagai admin' : 'Masuk e-Kinerja'}</h2>
    <p class="text-xs text-slate-500">KPU Kabupaten Buton Selatan</p></div>
    <input id="ekUser" required placeholder="Username" autocomplete="username" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
    <input id="ekPass" type="password" required placeholder="Password" autocomplete="current-password" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
    <p id="ekErr" class="text-xs text-rose-600 hidden"></p>
    <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg">Masuk</button>
  </form>`;
  document.body.appendChild(ov);
  const form = ov.firstElementChild, errEl = ov.querySelector('#ekErr');
  const err = t => { errEl.innerText = t; errEl.classList.toggle('hidden', !t); };

  form.onsubmit = ev => {
    ev.preventDefault(); err('');
    const u = ov.querySelector('#ekUser').value.trim().toLowerCase().replace(/\s+/g, '');
    signInWithEmailAndPassword(auth, u.includes('@') ? u : u + DOMAIN_USER, ov.querySelector('#ekPass').value)
      .catch(e => err(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(e.code)
        ? 'Username/email atau password salah.' : 'Gagal masuk (' + e.code + ').'));
  };

  onAuthStateChanged(auth, async u => {
    if (!u) { form.classList.remove('hidden'); return; }
    let p = {};
    try { const d = await getDoc(doc(fs, 'users', u.uid)); if (d.exists()) p = d.data(); } catch (e) {}
    const role = p.role === 'admin' ? 'admin' : 'pegawai';
    if (role !== perlu) { location.href = role === 'admin' ? 'dashboard.html' : 'index.html'; return; }
    ov.remove();
    onReady({ uid: u.uid, nama: p.nama || u.email.split('@')[0], role });
  });
};
