module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  globals: {
    __DEV__: true,
  },
  testMatch: ['<rootDir>/src/**/*.jest.ts', '<rootDir>/src/**/*.jest.tsx'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/queries/**/*.{ts,tsx}',
    'src/stores/**/*.{ts,tsx}',
    'src/features/**/*.ts',
    '!src/**/*.jest.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/queries/__testUtils/**',
    '!src/lib/supabase.ts',
    '!src/lib/queryClient.ts',
    '!src/lib/sentry.ts',
    '!src/lib/createRoleNavigation.ts',
    '!src/lib/nativeTabScreenListeners.ts',
    '!src/lib/useAdminNavigation.ts',
    '!src/lib/useGuardNavigation.ts',
    '!src/lib/useResidentNavigation.ts',
    '!src/lib/useAppFonts.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
    },
  },
  coverageReporters: ['text-summary', 'text', 'lcov', 'html'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
