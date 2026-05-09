# Syafa'ah Muslim Wear – E-Commerce Website

Website e-commerce premium untuk Syafa'ah Muslim Wear, menampilkan koleksi busana muslim berkualitas tinggi.

## 🌟 Fitur

### User / Pengunjung
- Lihat katalog produk lengkap (Mukena Anak, Mukena Dewasa, Gamis, Hijab, Koko Pria, Sarung)
- Filter produk berdasarkan kategori
- Cari produk dengan nama
- Lihat detail produk: foto, harga, varian, ukuran, dan deskripsi
- Panduan ukuran per kategori
- Tambah produk ke keranjang belanja (tersimpan di browser)
- Kirim pesan ke CS via WhatsApp

### Admin (Login: owner / 123456)
- Dashboard statistik produk
- Tambah, edit, hapus produk
- Kelola varian produk dengan foto
- Upload foto produk
- Atur panduan ukuran per produk
- Atur badge Best Seller
- Ubah nama website, tagline, nomor CS
- Ubah password admin

## 🗃️ Database (Supabase)
- `site_settings` – konfigurasi website
- `admin_users` – akun admin
- `products` – data produk
- `product_variants` – varian produk
- `size_guides` – panduan ukuran

## 🚀 Deploy ke GitHub Pages

1. Push semua file ke repository
2. Di GitHub: Settings → Pages → Source: Deploy from branch → branch: `main` → folder: `/ (root)`
3. Website akan tersedia di: `https://[username].github.io/[repo-name]/`

## 📁 Struktur File
```
/
├── index.html          # Halaman utama (katalog)
├── favicon.svg         # Logo/favicon
├── css/
│   ├── style.css       # CSS halaman user
│   └── admin.css       # CSS halaman admin
├── js/
│   ├── supabase.js     # Konfigurasi Supabase & helper
│   └── app.js          # Logic halaman user
└── admin/
    ├── login.html      # Login admin
    ├── dashboard.html  # Dashboard admin
    ├── products.html   # Manajemen produk
    ├── settings.html   # Pengaturan website
    └── admin.js        # JS shared admin
```

## 🔧 Konfigurasi
Supabase URL dan API key ada di `js/supabase.js`.
