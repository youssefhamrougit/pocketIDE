#!/usr/bin/env bash
# ============================================================
# Build PocketIDE.apk — a plain WebView wrapper around the
# standalone editor. No Gradle, no Android Studio required.
#
# Usage:
#   bash android/build.sh /path/to/output   (output = folder that receives PocketIDE.apk)
#
# Tools (JDK 17, Android build-tools 34, platform 33) are
# downloaded once into <output>/.build and reused on rebuilds.
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$PROJECT_DIR/.." && pwd)"

OUT_DIR="${1:-$REPO_DIR/dist}"
mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

BUILD_DIR="$OUT_DIR/.build"
WORK="$BUILD_DIR/work"
STORE_PASS="pocketide"
KEY_ALIAS="pocketide"

log() { echo "==> $*"; }

if ! command -v unzip >/dev/null 2>&1; then
  echo "ERROR: 'unzip' is required (install it or use Git Bash)." >&2
  exit 1
fi

# --- Locate or bootstrap tools ------------------------------------
BT="$(ls -d "$BUILD_DIR/bt"/* 2>/dev/null | head -1 || true)"
PLATFORM="$(ls -d "$BUILD_DIR/plat"/* 2>/dev/null | head -1 || true)"
JDK_HOME="$(ls -d "$BUILD_DIR/jdk"/* 2>/dev/null | head -1 || true)"

if [ -z "$BT" ]; then
  log "Downloading Android build-tools r34 (~58 MB)..."
  mkdir -p "$BUILD_DIR"
  curl -sL --retry 3 --max-time 1200 -o "$BUILD_DIR/build-tools.zip" \
    "https://dl.google.com/android/repository/build-tools_r34-windows.zip"
  mkdir -p "$BUILD_DIR/bt"
  (cd "$BUILD_DIR/bt" && unzip -qo ../build-tools.zip)
  BT="$(ls -d "$BUILD_DIR/bt"/* | head -1)"
fi
if [ -z "$PLATFORM" ]; then
  log "Downloading Android platform 33 (~67 MB)..."
  mkdir -p "$BUILD_DIR"
  curl -sL --retry 3 --max-time 1200 -o "$BUILD_DIR/platform-33.zip" \
    "https://dl.google.com/android/repository/platform-33_r02.zip"
  mkdir -p "$BUILD_DIR/plat"
  (cd "$BUILD_DIR/plat" && unzip -qo ../platform-33.zip)
  PLATFORM="$(ls -d "$BUILD_DIR/plat"/* | head -1)"
fi
if [ -z "$JDK_HOME" ]; then
  log "Downloading Temurin JDK 17 (~190 MB)..."
  mkdir -p "$BUILD_DIR"
  curl -sL --retry 3 --max-time 1800 -o "$BUILD_DIR/jdk17.zip" \
    "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
  mkdir -p "$BUILD_DIR/jdk"
  (cd "$BUILD_DIR/jdk" && unzip -qo ../jdk17.zip)
  JDK_HOME="$(ls -d "$BUILD_DIR/jdk"/* | head -1)"
fi
JDK="$JDK_HOME/bin"
log "Using: javac=$JDK/javac, build-tools=$BT, platform=$PLATFORM"

# --- Icon tooling (sharp) -----------------------------------------
if [ ! -d "$BUILD_DIR/iconbuild/node_modules" ]; then
  log "Installing sharp for icon rasterization..."
  mkdir -p "$BUILD_DIR/iconbuild"
  [ -f "$BUILD_DIR/iconbuild/package.json" ] || printf '{"name":"iconbuild","private":true}\n' > "$BUILD_DIR/iconbuild/package.json"
  (cd "$BUILD_DIR/iconbuild" && npm install sharp --no-audit --no-fund --loglevel=error)
fi

# --- Work dir ------------------------------------------------------
rm -rf "$WORK"
mkdir -p "$WORK/assets"

log "Copying app files into APK assets..."
mkdir -p "$WORK/assets/vendor"
cp "$REPO_DIR/index.html" "$REPO_DIR/app.js" "$REPO_DIR/styles.css" "$WORK/assets/"
cp "$REPO_DIR/vendor/"*.js "$WORK/assets/vendor/"

log "Assembling resources..."
cp -r "$PROJECT_DIR/res/." "$WORK/res/"
cp "$PROJECT_DIR/gen-icons.mjs" "$BUILD_DIR/iconbuild/gen-icons.mjs"
(cd "$BUILD_DIR/iconbuild" && node gen-icons.mjs "$REPO_DIR/brand/logo.svg" "$WORK")

# --- Compile resources --------------------------------------------
log "aapt2 compile..."
"$BT/aapt2.exe" compile --dir "$WORK/res" -o "$WORK/compiled.zip"

log "aapt2 link..."
"$BT/aapt2.exe" link -o "$WORK/base.apk" \
  -I "$PLATFORM/android.jar" \
  --manifest "$PROJECT_DIR/AndroidManifest.xml" \
  -A "$WORK/assets" \
  "$WORK/compiled.zip"

# --- Compile Java -> dex ------------------------------------------
log "javac..."
mkdir -p "$WORK/classes"
"$JDK/javac" -source 8 -target 8 -Xlint:-options -nowarn \
  -bootclasspath "$PLATFORM/android.jar" \
  -d "$WORK/classes" \
  $(find "$PROJECT_DIR/java" -name '*.java')

log "d8 (dex)..."
mkdir -p "$WORK/dexout"
"$JDK/java" -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 \
  --release --min-api 21 \
  --lib "$PLATFORM/android.jar" \
  --output "$WORK/dexout" \
  $(find "$WORK/classes" -name '*.class')

log "Adding classes.dex to APK..."
(cd "$WORK/dexout" && "$JDK/jar" --update --file "$WORK/base.apk" classes.dex)

# --- Sign & align -------------------------------------------------
if [ ! -f "$BUILD_DIR/release.keystore" ]; then
  log "Generating signing keystore..."
  "$JDK/keytool" -genkeypair \
    -keystore "$BUILD_DIR/release.keystore" \
    -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass "$STORE_PASS" -keypass "$STORE_PASS" \
    -dname "CN=PocketIDE, OU=Mobile, O=PocketIDE, C=US"
fi

log "zipalign..."
"$BT/zipalign.exe" -f -p 4 "$WORK/base.apk" "$WORK/aligned.apk"

log "apksigner sign..."
"$JDK/java" -jar "$BT/lib/apksigner.jar" sign \
  --ks "$BUILD_DIR/release.keystore" \
  --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$STORE_PASS" \
  --key-pass "pass:$STORE_PASS" \
  --out "$OUT_DIR/PocketIDE.apk" \
  "$WORK/aligned.apk"

log "Verifying signature..."
"$JDK/java" -jar "$BT/lib/apksigner.jar" verify --print-certs "$OUT_DIR/PocketIDE.apk"

# --- Extras for the output folder ---------------------------------
cp "$WORK/web/icon-512.png" "$OUT_DIR/logo.png"
cp "$WORK/web/icon-512.png" "$OUT_DIR/icon-512.png"
cp "$REPO_DIR/README.md" "$OUT_DIR/README.md"

SIZE=$(du -h "$OUT_DIR/PocketIDE.apk" | cut -f1)
log "Done! $OUT_DIR/PocketIDE.apk ($SIZE)"
