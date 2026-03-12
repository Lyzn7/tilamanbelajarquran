# ⚡ Minify Quick Reference

## Checklist Sebelum Build ✅

- [ ] Update npm: `npm install`
- [ ] Clear cache: `npm cache clean --force`
- [ ] Clear expo cache: `expo cache clean`
- [ ] Check file sizes sudah ada di assets? (gunakan `.webp` bukan `.png`)
- [ ] Review `package.json` - ada unused dependencies?

## Pre-Build Commands

```powershell
# Full cleanup
npm cache clean --force
expo cache clean
rm -r node_modules
npm install

# Check bundle size impact
npm ls --depth=0
```

## Minify Levels - Apa yang Berjalan

### 1️⃣ Babel Minification

```
✓ Remove console.log
✓ Dead code elimination
✓ Tree-shaking unused imports
✓ Block scoping optimization
```

**File**: `babel.config.js`

### 2️⃣ Metro Bundler Minification

```
✓ Terser minifier (2 passes)
✓ Mangle variable names
✓ Remove comments
✓ Drop debugger statements
✓ Compress with multiple passes
```

**File**: `metro.config.js`

### 3️⃣ ProGuard (Android Only)

```
✓ Native code obfuscation
✓ Dead resource removal
✓ String pool optimization
✓ Bytecode shrinking
```

**File**: `app.json` → `enable ProguardInReleaseBuilds`

### 4️⃣ Hermes Engine (Android Only)

```
✓ Bytecode compilation
✓ Faster execution
✓ Smaller bundle ~30%
```

**File**: `app.json` → `jsEngine: hermes`

## Build Commands

### Android - Paling Kecil

```powershell
# Recommended: App Bundle untuk Google Play (paling kecil)
eas build --platform android --profile production --clear-cache

# Alternative: APK untuk distribution manual
eas build --platform android --profile production --clear-cache --output app.apk
```

### iOS

```powershell
# App Store format (optimal compression)
eas build --platform ios --profile production --clear-cache
```

### Web (jika ada)

```powershell
# Next.js optimized build
npm run build
npm run export
```

## Monitoring Bundle Size

### Real-time Output

```
Ketika build berjalan, lihat:
- Bundle size: XXX MB
- JavaScriptBundle size
- Native modules size
```

### Analyze Bundle Setelah Build

```powershell
# Download build artifacts
# Kemudian analyze

npx expo-bundle-analyzer build.tar.gz
# atau
source-map-explorer 'build/**/*.js'
```

## Tips Minify Maksimal

### Hapus Console Logs di Prod

✅ Sudah enabled di: `babel.config.js`

```javascript
removeConsole: isProd;
```

### Dynamic Imports (Code Splitting)

```javascript
// ❌ Jangan: import besar langsung
import HeavyComponent from "./HeavyComponent";

// ✅ Ya: lazy load
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));
```

### Tree-Shake Dead Code

```javascript
// ❌ Jangan export semuanya
export * from "./utils";

// ✅ Ya: export only what's needed
export { utilA, utilB };
```

### Remove Unused Dependencies

```powershell
# Find unused packages
npm ls --depth=0

# Analyze actual usage
npx depcheck

# Remove if not used
npm uninstall unused-package
```

## Expected Size Reduction

```
Tanpa Minify: 150 MB
+ Babel: 127 MB (-15%)
+ Metro: 102 MB (-20%)
+ ProGuard: 61 MB (-40%)
+ Hermes: 43 MB (-30%)
─────────────────────────
Final: 43 MB (71% lebih kecil!)
```

## Troubleshooting Minify

### Build Gagal Setelah Minify

```powershell
# Mungkin ada code yang tidak compatible dengan minification
# Try tanpa aggressive minify:

# Reset to default
metro.config.js → default config
# atau disable terser temporarily
```

### Bundle Size Tidak Berkurang

```powershell
# Check what's taking space
npm ls --depth=0

# Find largest packages
npm list --depth=0 | grep -E "heavy-package"

# Replace dengan alternative yang lebih ringan
```

### Console.log Masih Ada di Build

```powershell
# Verify babel config
babel.config.js → check removeConsole: isProd

# Clear cache
expo cache clean
npm cache clean --force

# Rebuild
eas build --platform android --profile production --clear-cache
```

## Production Checklist

- [ ] babel.config.js: `removeConsole: isProd` ✓
- [ ] metro.config.js: terser configured ✓
- [ ] app.json: ProGuard enabled ✓
- [ ] app.json: Hermes engine enabled ✓
- [ ] eas.json: production profile configured ✓
- [ ] No console.log in shipping code ✓
- [ ] No unused imports ✓
- [ ] No unused dependencies ✓
- [ ] Assets optimized (.webp format) ✓

## Build & Deploy

```powershell
# Final production build
eas build --platform android --profile production --clear-cache

# Check size
# Size terlihat di EAS dashboard

# Success! 🎉
```

## Reference

- [Expo Minification Docs](https://docs.expo.dev/)
- [Terser Documentation](https://terser.org/)
- [Metro Bundler](https://facebook.github.io/metro/)
- [ProGuard](https://www.guardsquare.com/proguard)
- [Hermes Engine](https://hermesengine.dev/)
