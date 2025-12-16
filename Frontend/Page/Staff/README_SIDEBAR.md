# Sidebar Component untuk Staff Interface

## Struktur File

File sidebar telah dipisahkan menjadi komponen yang dapat digunakan kembali:

1. **sidebar.html** - Template HTML sidebar (untuk referensi)
2. **sidebar.css** - Styling untuk sidebar
3. **sidebar.js** - Script untuk memuat sidebar dan mengatur menu aktif

## Cara Menggunakan

Setiap halaman staff sudah dikonfigurasi untuk menggunakan sidebar component:

### 1. Link CSS di `<head>`

```html
<link rel="stylesheet" href="sidebar.css" />
```

### 2. Placeholder di dalam `<body>`

```html
<div id="sidebar-placeholder"></div>
```

### 3. Script sebelum `</body>`

```html
<script src="sidebar.js"></script>
```

## Fitur

- **Auto Active Menu**: Menu otomatis menandai halaman aktif berdasarkan URL
- **Icon Switching**: Ikon berubah menjadi merah saat menu aktif
- **Smooth Transitions**: Efek hover dan transisi yang smooth

## Halaman yang Menggunakan Sidebar

- homepage_staf.html
- validasiprestasi_staf.html
- validasiprestasi_staf_dpt.html
- validasiprestasi_staf_verif.html
- rankingmahasiswa_staf.html
- profil_staf.html

## Konfigurasi Menu

Menu items dikonfigurasi di `sidebar.js` dengan atribut `data-page`:

- `data-page="homepage_staf"` - Untuk halaman homepage staf
- `data-page="validasiprestasi_staf"` - Untuk semua halaman validasi prestasi (validasiprestasi_staf, validasiprestasi_staf_dpt, validasiprestasi_staf_verif)
- `data-page="rankingmahasiswa_staf"` - Untuk halaman ranking mahasiswa
- `data-page="profil_staf"` - Untuk halaman profil staf
- `data-page="riwayatverif"` - Untuk halaman riwayat verifikasi (placeholder)

## Menu Items

### MENU

- Dashboard (homepage_staf.html)
- Validasi Prestasi (validasiprestasi_staf.html)
- Rangking Mahasiswa (rankingmahasiswa_staf.html)
- Riwayat Verifikasi (placeholder: #)

### UMUM

- Profil Staf (profil_staf.html)
- Keluar (../landingpage.html)

## Catatan

- Semua path menggunakan relative path `../../png/` untuk ikon
- Logout link mengarah ke `../landingpage.html`
- JavaScript otomatis mendeteksi halaman aktif dan mengubah ikon ke versi merah (\*\_red.png)
- Sidebar CSS sudah dihapus dari semua file HTML individual
