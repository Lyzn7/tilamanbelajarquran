# tilamanbelajarquran (Expo + React Native)

A lightweight Qur'an reader focused on comfortable reading, offline-friendly caching, and audio controls. Built with Expo, React Navigation, and TanStack Query.

## Menjalankan proyek
- Pastikan Node.js & Expo CLI terpasang.
- Salin `.env.example` menjadi `.env` lalu sesuaikan `EXPO_PUBLIC_BASE_URL` (default: `https://equran.id/api/v2`).
- Instal dependensi: `npm install`
- Mulai dev server: `npm run start`
  - Android: `npm run android`
  - Web: `npm run web`

## Build Android (Expo)
- Pastikan akun Expo terkonfigurasi, lalu jalankan `npx expo build:android` atau `eas build -p android` sesuai setup Anda.

## Arsitektur folder
- `App.tsx` – bootstrap provider (theme, query cache, persistence) dan navigator.
- `src/api` – client axios + wrapper endpoint equran v2.
- `src/types` – tipe response API asli.
- `src/navigation` – bottom tabs (Alquran, Belajar Baca, Game) + stack (Reader, Search, Settings, Juz placeholder).
- `src/screens` – SurahList, SurahDetail/Reader, Search, Settings, Juz placeholder, Belajar/Game placeholder.
- `src/components` – AyahCard, SurahCard, FontSizeSlider, ToggleTranslation, dsb.
- `src/store` – state terpersisten (settings, bookmarks, last read).
- `src/theme` – palet warna terang/gelap.

## Pemetaaan endpoint equran.id v2
- `GET /surat` → `SurahListScreen` (daftar surat + search filter).
- `GET /surat/{nomor}` → `SurahDetailScreen` (ayat, audio per ayat, audio full, info surat, next/prev).
- `GET /tafsir/{nomor}` → `SurahDetailScreen` (panel tafsir ringkas).
- (Tidak ada endpoint Juz maupun pencarian ayat di dokumentasi v2; halaman Juz & search ayat menampilkan status/placeholder dan memakai filter lokal nama surat).

## Fitur utama
- Mushaf reader: teks Arab besar (font Scheherazade), transliterasi & terjemahan (toggle), dark/light/system theme, slider ukuran font.
- Audio: play/pause per ayat, play full surah, pilih qari (6 pilihan dari API), auto play next & repeat ayat.
- Navigasi ayat: scroll to ayah, indikator ayat aktif, bookmark ayat & last read (persist AsyncStorage).
- Daftar surat: search/filter, detail ringkas, indikator last-read per surat.
- Offline: cache data API dengan TanStack Query + AsyncStorage persister.
- Settings: theme override, toggle terjemahan, slider font, toggle audio behaviour, tampil base URL.
- Placeholder: Belajar Baca & Game (Coming Soon), Juz (menunggu endpoint resmi).

## Catatan implementasi API
- Semua permintaan mengikuti dokumen resmi https://equran.id/apidev/v2 (pada 1 Feb 2026 hanya tersedia: /surat, /surat/{id}, /tafsir/{id}).
- Tidak ada field tajwid atau pencarian ayat di v2; highlight tajwid tidak ditampilkan (fallback normal).
- Audio qari diambil dari key `audio` (per ayat) dan `audioFull` (per surat) dengan kode 01-06.

## Environment
```
EXPO_PUBLIC_BASE_URL=https://equran.id/api/v2
```

Ubah nilai jika API mirror berbeda. Base URL terbaca di layar Settings.
