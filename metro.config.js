const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getSentryExpoConfig(__dirname);

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

const screenshotsVideoPath = path.resolve(__dirname, 'assets/screenshots-video');
const existingBlockList = config.resolver?.blockList;
const blockListPatterns = Array.isArray(existingBlockList)
  ? existingBlockList
  : existingBlockList
    ? [existingBlockList]
    : [];

config.resolver = {
  ...config.resolver,
  // Keep submission screenshots/video in git, but out of Metro and APK bundles.
  blockList: [
    ...blockListPatterns,
    new RegExp(`${escapeRegex(screenshotsVideoPath)}[/\\\\].*`),
  ],
};

config = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

module.exports = config;
