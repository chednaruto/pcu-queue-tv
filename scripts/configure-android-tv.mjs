import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = path.join(root, 'android');
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error('Android project not found. Run: npx cap add android');
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

if (!xml.includes('android.software.leanback')) {
  xml = xml.replace(/<application\b/, `  <uses-feature android:name="android.software.leanback" android:required="false" />\n  <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n\n  <application`);
}

xml = xml.replace(/<application([^>]*)>/, (full, attrs) => {
  let next = attrs;
  if (!/android:banner=/.test(next)) next += ' android:banner="@drawable/banner"';
  if (!/android:usesCleartextTraffic=/.test(next)) next += ' android:usesCleartextTraffic="true"';
  return `<application${next}>`;
});

xml = xml.replace(/<activity([^>]*android:name="\.MainActivity"[^>]*)>/, (full, attrs) => {
  let next = attrs;
  if (!/android:screenOrientation=/.test(next)) next += ' android:screenOrientation="landscape"';
  return `<activity${next}>`;
});

if (!xml.includes('android.intent.category.LEANBACK_LAUNCHER')) {
  xml = xml.replace(
    '<category android:name="android.intent.category.LAUNCHER" />',
    '<category android:name="android.intent.category.LAUNCHER" />\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />'
  );
}

fs.writeFileSync(manifestPath, xml);

const packageDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'th', 'go', 'xhealth', 'pcuqueuedisplay');
fs.mkdirSync(packageDir, { recursive: true });
for (const file of ['MainActivity.java', 'QueueTtsPlugin.java']) {
  fs.copyFileSync(path.join(root, 'android-tv-template', 'java', file), path.join(packageDir, file));
}

const drawableDir = path.join(androidRoot, 'app', 'src', 'main', 'res', 'drawable');
fs.mkdirSync(drawableDir, { recursive: true });
const bannerXml = `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="320dp" android:height="180dp" android:viewportWidth="320" android:viewportHeight="180">\n  <path android:fillColor="#0F172A" android:pathData="M0,0h320v180h-320z"/>\n  <path android:fillColor="#38BDF8" android:pathData="M145,40h30v35h35v30h-35v35h-30v-35h-35v-30h35z"/>\n</vector>\n`;
fs.writeFileSync(path.join(drawableDir, 'banner.xml'), bannerXml);

console.log('Android TV configuration applied: Leanback launcher, landscape, cleartext HTTP, keep-screen-on, immersive mode, native Thai TTS.');
