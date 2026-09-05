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

Konfigurasi provider:

- `AI_API_KEY`, `AI_API_URL`, dan `AI_MODEL` untuk chat.
- `AI_IMAGE_API_KEY`, `AI_IMAGE_API_URL`, `AI_IMAGE_MODEL`, dan `AI_IMAGE_SIZE` untuk Studio Foto AI. Endpoint harus kompatibel dengan OpenAI Images Edits dan mengembalikan `data[].b64_json` atau `data[].url`.
- `AI_VISION_API_KEY`, `AI_VISION_API_URL`, dan `AI_VISION_MODEL` untuk pertanyaan tentang isi foto.
- Permintaan proposal, makalah, skripsi, atau penelitian otomatis memicu pencarian referensi live OpenAlex melalui `/api/academic/sources?q=...` sebelum jawaban dibuat.

Salin `Back end/.env.example` menjadi `Back end/.env`, isi kredensial provider, lalu redeploy backend. Tanpa konfigurasi image provider, Studio akan menampilkan status yang jelas dan tidak berpura-pura menghasilkan foto.
