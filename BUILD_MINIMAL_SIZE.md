# Panduan Build Aplikasi Dengan Ukuran Minimal

## Optimasi yang Telah Dilakukan

### 1. **app.json** - Konfigurasi Engine & Minification

- ✅ **Hermes Engine** untuk Android (mengurangi ukuran ~30%)
- ✅ **ProGuard** - Minification code di release build (mengurangi ~40%)
- ✅ **Shrink Resources** - Hapus resources yang tidak digunakan
- ✅ **Min SDK 29** (kompatibel dengan ~99% devices)
- ✅ **Target SDK 34** (latest Android version)

### 2. **eas.json** - Build Configuration Optimal

- ✅ **App Bundle Format** untuk Android (lebih kecil dari APK)
- ✅ **App Store Format** untuk iOS (optimal compression)

## Cara Build

### Untuk Android APK (Ukuran Terkecil):

```bash
# 1. Clean cache
eas build --platform android --profile production --clear-cache

# atau jika hanya ingin build lokal tanpa upload
expo export --platform android
```

### Untuk Android App Bundle (Recommended untuk Google Play):

```bash
eas build --platform android --profile production
```

### Untuk iOS:

```bash
eas build --platform ios --profile production
```

## Langkah-langkah Detail untuk Hasil Optimal

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Login ke EAS

```bash
eas login
```

### Step 3: Build Production

```bash
# Android - Paling kecil
eas build --platform android --profile production

# atau jika ingin check ukuran sebelum final
eas build --platform android --profile preview
```

### Step 4: Monitor Bundle Size

Selama build, perhatikan output untuk tracking ukuran bundle:

```
Bundle size: XXX MB
```

## Tips Tambahan Untuk Memperkecil Ukuran

### 1. **Check Bundle Analysis**

```bash
npx expo-bundle-analyzer build.tar.gz
```

### 2. **Hapus Unused Dependencies**

Jika ada package yang tidak digunakan:

```bash
npm prune --production
```

### 3. **Optimalkan Assets**

- Kompres images lebih agresif
- Gunakan .webp format untuk images
- Hapus splash screen jika tidak perlu

### 4. **Enable Sound Minification (iOS)**

Di `eas.json`, tambahkan untuk iOS:

```json
"ios": {
  "buildType": "app-store",
  "scheme": "Release"
}
```

## Estimasi Ukuran Final

Dengan optimasi ini:

- **Android APK**: ~50-70 MB (tergantung assets)
- **Android App Bundle**: ~30-45 MB per variant
- **iOS**: ~60-80 MB (setelah App Store optimization)

## 🔥 MINIFY STRATEGY (Pengurangan Ukuran 50-60%)

### Apa itu Minify?

Minify adalah proses mengurangi ukuran kode dengan:

- Menghapus spasi, newline, dan komentar
- Mempendek nama variabel (a, b, c)
- Menghapus dead code (code yang tidak dipakai)
- Menghapus console.log di production

### Minify Levels yang Diterapkan:

#### **Level 1: Babel Minification** ✅

File: `babel.config.js`

```javascript
// Remove console.log di production
removeConsole: isProd

// Tree-shaking untuk unused imports
modules: isProd ? false : "auto"

// Dead code elimination plugins
@babel/plugin-transform-runtime
@babel/plugin-transform-block-scoping
```

#### **Level 2: Metro Bundler Minification** ✅

File: `metro.config.js`

```javascript
// Terser minifier dengan 2 passes compression
minifierPath: "metro-minify-terser"

// Aggressive compression options:
- passes: 2 (lebih aggressive)
- drop_console: true (hapus semua console)
- dead_code: true (hapus unused code)
- mangle: true (perpendek nama variabel)
```

#### **Level 3: ProGuard (Android)** ✅

File: `app.json`

```json
"enableProguardInReleaseBuilds": true
```

#### **Level 4: Hermes Engine (Android)** ✅

```json
"jsEngine": "hermes"
```

- Compiled bytecode (lebih kecil & cepat)
- Native compilation untuk Android

### Estimasi Pengurangan Ukuran:

| Level           | Pengurangan | Kumulatif |
| --------------- | ----------- | --------- |
| Babel Minify    | ~15%        | 15%       |
| Metro Terser    | ~20%        | 33%       |
| ProGuard        | ~40%        | 62%       |
| Hermes + Shrink | ~30%        | 75%       |

### Cara Verify Minification Berjalan:

```bash
# Check bundle size sebelum & sesudah
eas build --platform android --profile production --clear-cache

# Atau analyze bundle secara detail
expo export --platform android
metro-bundle-analyzer
```

### Command Build dengan Minify:

```bash
# Clean cache untuk force minify
eas build --platform android --profile production --clear-cache

# Atau buat lokal
expo export --platform android
npx react-native-bundle.android --dev false
```

## Flag Build yang Berguna

### Production Minimal Size:

```bash
# Dengan analytics
eas build --platform android --profile production --clear-cache --json

# Tanpa cache untuk hasil clean
eas build --platform android --profile production --clear-cache
```

## Troubleshooting

### Jika Build Gagal:

```bash
# Hapus cache expo
expo cache clean

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install --legacy-peer-deps
```

### Jika Build Terlalu Besar:

1. Check dependencies yang berat: `npm ls --depth=0`
2. Replace dengan alternatif yang lebih ringan
3. Gunakan dynamic imports untuk code splitting

## Resources

- [Expo Build Documentation](https://docs.expo.dev/build-reference/apk/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Hermes Engine](https://hermesengine.dev/)
