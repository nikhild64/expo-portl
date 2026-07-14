#!/usr/bin/env node
/**
 * Install the release APK on every connected ADB device/emulator.
 *
 * Usage: node scripts/install-apk.js [path/to/app.apk]
 *   Defaults to android/app/build/outputs/apk/release/app-release.apk
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_APK = path.join(
  ROOT,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk'
);

const apkPath = path.resolve(process.argv[2] || DEFAULT_APK);

if (!fs.existsSync(apkPath)) {
  console.error('APK not found:');
  console.error('  ' + apkPath);
  console.error('Build first with: bun run build:android:apk');
  process.exit(1);
}

function listDevices() {
  const output = execFileSync('adb', ['devices'], { encoding: 'utf8' });
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, status] = line.split(/\s+/);
      return { serial, status };
    })
    .filter(({ serial, status }) => serial && status === 'device');
}

const devices = listDevices();

if (devices.length === 0) {
  console.error('No ADB devices found. Connect a device or start an emulator.');
  process.exit(1);
}

console.log(`Installing ${apkPath}`);
console.log(`Targets (${devices.length}): ${devices.map((d) => d.serial).join(', ')}`);
console.log('');

let failures = 0;

for (const { serial } of devices) {
  process.stdout.write(`${serial} ... `);
  const result = spawnSync('adb', ['-s', serial, 'install', '-r', apkPath], {
    encoding: 'utf8',
  });

  if (result.status === 0) {
    console.log('ok');
    continue;
  }

  failures += 1;
  console.log('failed');
  const detail = (result.stderr || result.stdout || '').trim();
  if (detail) {
    console.error('  ' + detail.replace(/\n/g, '\n  '));
  }
}

console.log('');
if (failures > 0) {
  console.error(`Done with ${failures} failure(s) out of ${devices.length} device(s).`);
  process.exit(1);
}

console.log(`Installed on ${devices.length} device(s).`);
