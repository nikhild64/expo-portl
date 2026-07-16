declare const global: typeof globalThis & { __DEV__: boolean; IS_REACT_ACT_ENVIRONMENT?: boolean };
global.IS_REACT_ACT_ENVIRONMENT = true;

import { notifyManager } from '@tanstack/react-query';

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.EXPO_PUBLIC_ENABLE_HINDI ??= 'false';

global.__DEV__ = true;

import { act } from 'react';

// Avoid deferred setTimeout batches from React Query leaking past test teardown.
notifyManager.setScheduler((callback) => {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('The current testing environment is not configured to support act')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  try {
    act(() => {
      callback();
    });
  } finally {
    console.error = originalConsoleError;
  }
});
