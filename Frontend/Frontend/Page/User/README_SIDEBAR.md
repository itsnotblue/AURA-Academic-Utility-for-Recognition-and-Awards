# Sidebar Component untuk User Interface

## Struktur File

File sidebar telah dipisahkan menjadi komponen yang dapat digunakan kembali:

1. **sidebar.html** - Template HTML sidebar
2. **sidebar.css** - Styling untuk sidebar
3. **sidebar.js** - Script untuk memuat sidebar dan mengatur menu aktif

## Cara Menggunakan

Setiap halaman user sudah dikonfigurasi untuk menggunakan sidebar component:

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

- homepage.html
- dataprestasi_rm.html
- dataprestasi_md.html
- profilprestasi.html
- profilprestasi_sv.html
- profilprestasi_sv_edit.html
- profilprestasi_ib.html

## Konfigurasi Menu

Menu items dikonfigurasi di `sidebar.html` dengan atribut `data-page`:

- `data-page="homepage"` - Untuk halaman homepage
- `data-page="dataprestasi"` - Untuk semua halaman data prestasi (dataprestasi_rm, dataprestasi_md)
- `data-page="profilprestasi"` - Untuk semua halaman profil prestasi (profilprestasi, profilprestasi_sv, dll)

## Catatan

- Semua path menggunakan relative path `../../png/` untuk ikon
- Logout link mengarah ke `../landingpage.html`
- JavaScript otomatis mendeteksi halaman aktif dan mengubah ikon ke versi merah (\*\_red.png)
