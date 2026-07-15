/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

const plugins = appJson.expo.plugins.filter(
  (plugin) =>
    plugin !== '@sentry/react-native' &&
    !(Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo'),
);

if (sentryOrg && sentryProject) {
  plugins.push([
    '@sentry/react-native/expo',
    {
      url: 'https://sentry.io/',
      organization: sentryOrg,
      project: sentryProject,
    },
  ]);
}

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
  },
};
