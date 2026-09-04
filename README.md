# AI PENTER

V1 dari AI PENTER: web chat AI dengan backend Express dan penyimpanan percakapan SQLite.

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru.

```powershell
cd "Front end"
npm install
npm run dev
```

Di terminal lain:

```powershell
cd "Back end"
npm install
npm run dev
```

Buka http://localhost:5173. Backend berjalan di http://localhost:3001.

Saat ini endpoint chat memakai mode demo yang aman untuk pengembangan. Untuk integrasi model AI sungguhan, tambahkan provider di server dan simpan kredensial hanya di environment variable, bukan di frontend.
