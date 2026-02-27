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
- `App.tsx` - bootstrap provider (theme, query cache, persistence) dan navigator.
- `src/api` - client axios + wrapper endpoint equran v2.
- `src/types` - tipe response API asli.
- `src/navigation` - bottom tabs (Alquran, Imsakiyah, Shalat, Belajar Baca, Pro Search) + stack (Reader, Search, Settings, Juz placeholder).
- `src/screens` - SurahList, SurahDetail/Reader, Search, Settings, Imsakiyah, Shalat, Juz placeholder, Belajar/Game placeholder.
- `src/components` - AyahCard, SurahCard, FontSizeSlider, ToggleTranslation, SelectField, dsb.
- `src/store` - state terpersisten (settings, bookmarks, last read, lokasi jadwal).
- `src/theme` - palet warna terang/gelap.

## Pemetaan endpoint equran.id v2
- `GET /surat` -> `SurahListScreen` (daftar surat + search filter).
- `GET /surat/{nomor}` -> `SurahDetailScreen` (ayat, audio per ayat, audio full, info surat, next/prev).
- `GET /tafsir/{nomor}` -> `SurahDetailScreen` (panel tafsir ringkas).
- `GET /imsakiyah/provinsi`, `POST /imsakiyah/kabkota`, `POST /imsakiyah` -> `ImsakiyahScreen` (jadwal Ramadhan 1447H / 2026M).
- `GET /shalat/provinsi`, `POST /shalat/kabkota`, `POST /shalat` -> `ShalatScreen` (jadwal shalat bulanan + sorotan hari ini).
- (Tidak ada endpoint Juz maupun pencarian ayat di dokumentasi v2; halaman Juz & search ayat menampilkan status/placeholder dan memakai filter lokal nama surat).

## Fitur utama
- Mushaf reader: teks Arab besar (font Scheherazade), transliterasi dan terjemahan (toggle), dark/light/system theme, slider ukuran font.
- Audio: play/pause per ayat, play full surah, pilih qari (6 pilihan dari API), auto play next dan repeat ayat.
- Navigasi ayat: scroll to ayah, indikator ayat aktif, bookmark ayat dan last read (persist AsyncStorage).
- Daftar surat: search/filter, detail ringkas, indikator last-read per surat.
- Imsakiyah & Shalat: pilih provinsi/kabkota, tarik jadwal Ramadhan 1447H atau jadwal shalat bulanan, highlight hari ini, countdown event berikut, pengaturan tanggal awal Ramadhan, dan pengingat imsak/maghrib (notifikasi lokal Expo).
- Offline: cache data API dengan TanStack Query + AsyncStorage persister.
- Settings: theme override, toggle terjemahan, slider font, toggle audio behaviour, tampil base URL.
- Placeholder: Belajar Baca dan Game (Coming Soon), Juz (menunggu endpoint resmi).

## Catatan implementasi API
- Semua permintaan mengikuti dokumen resmi https://equran.id/apidev/v2 (pada 1 Feb 2026 hanya tersedia: /surat, /surat/{id}, /tafsir/{id}).
- Tidak ada field tajwid atau pencarian ayat di v2; highlight tajwid tidak ditampilkan (fallback normal).
- Audio qari diambil dari key `audio` (per ayat) dan `audioFull` (per surat) dengan kode 01-06.

## Environment
```
EXPO_PUBLIC_BASE_URL=https://equran.id/api/v2
```

Ubah nilai jika API mirror berbeda. Base URL terbaca di layar Settings.

---

# Android Native (android-app/)

Folder `android-app/` berisi proyek Android Studio full-Kotlin dengan Jetpack Compose + WorkManager + AlarmManager yang memetakan semua endpoint equran.id v2 serta jadwal imsakiyah/shalat Ramadhan 1447H (2026).

## Cara jalan
1. Buka `android-app/` di Android Studio (AGP 8.3, Gradle 8.6).
2. Sinkronisasi Gradle, lalu jalankan konfigurasi `app` pada emulator/perangkat.
   - Atau via CLI: `cd android-app && ./gradlew :app:installDebug`.
3. Pastikan izin `POST_NOTIFICATIONS` disetujui di Android 13+ agar alarm menampilkan notifikasi.

## Fitur inti yang dibangun
- Default lokasi dan awal Ramadhan tersimpan di DataStore dengan nilai awal `DI Yogyakarta` + `Kabupaten Bantul` dan `2026-02-18`.
- Penentuan hari Ramadhan: `(today - startRamadanDate) + 1`; hari 1-30 memakai jadwal imsakiyah harian, di luar rentang memakai jadwal shalat bulanan.
- Countdown di Home: event berikut dihitung dari urutan imsak -> isya; jika semua lewat, target otomatis ke imsak besok.
- Alarm exact (Imsak dan Maghrib) + offset menit, dijadwalkan ulang saat boot serta oleh WorkManager harian (default 00:05).
- Quran: daftar surat, detail ayat dengan audio qari 01-06 (ExoPlayer), tafsir per surat.
- Shalat: tampilan bulanan + cepat hari ini.
- Ramadhan: daftar 30 hari + kartu hari ini menampilkan nomor hari dan jadwal.
- Settings: ganti lokasi (provinsi/kabkota dari API), pilih qari, ubah tanggal mulai Ramadhan, toggle alarm dan offset.

## Struktur penting
- `app/src/main/java/com/tilamanbelajarquran/api/` - Retrofit models dan service ke equran.id v2.
- `data/` - DataStore (AppPreferences) dan `ScheduleRepository` (logika Ramadhan/shalat).
- `alarm/` - AlarmManager scheduler, receiver, boot handling.
- `work/` - WorkManager untuk refresh dan penjadwalan ulang harian.
- `ui/` - ViewModel + layar Compose (Home, Quran, Shalat, Ramadhan, Settings).

## Menyesuaikan model API
- Ubah skema respons di `api/ApiModels.kt` jika equran.id menambah field baru.
- Parsing waktu selalu via `LocalTime.parse(..., pattern "H:mm")` di `data/ScheduleRepository.kt`.
