const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getSentryExpoConfig(__dirname);

config = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

module.exports = config;
