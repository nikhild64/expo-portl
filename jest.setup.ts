declare const global: typeof globalThis & { __DEV__: boolean };

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.EXPO_PUBLIC_ENABLE_HINDI ??= 'false';

global.__DEV__ = true;
