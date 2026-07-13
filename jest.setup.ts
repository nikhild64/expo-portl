declare const global: typeof globalThis & { __DEV__: boolean };

global.__DEV__ = true;
