import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { LargeSecureStore } from './largeSecureStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockAsyncGet = AsyncStorage.getItem as jest.Mock;
const mockAsyncSet = AsyncStorage.setItem as jest.Mock;
const mockAsyncRemove = AsyncStorage.removeItem as jest.Mock;
const mockSecureGet = SecureStore.getItemAsync as jest.Mock;
const mockSecureSet = SecureStore.setItemAsync as jest.Mock;
const mockSecureDelete = SecureStore.deleteItemAsync as jest.Mock;

describe('LargeSecureStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncGet.mockResolvedValue(null);
    mockAsyncSet.mockResolvedValue(undefined);
    mockAsyncRemove.mockResolvedValue(undefined);
    mockSecureGet.mockResolvedValue(null);
    mockSecureSet.mockResolvedValue(undefined);
    mockSecureDelete.mockResolvedValue(undefined);
  });

  it('round-trips a session through encrypt/decrypt storage', async () => {
    const store = new LargeSecureStore();
    const session = JSON.stringify({ access_token: 'jwt', refresh_token: 'rt' });

    await store.setItem('sb-test-auth-token', session);

    const encrypted = mockAsyncSet.mock.calls[0][1] as string;
    const keyHex = mockSecureSet.mock.calls[0][1] as string;

    mockAsyncGet.mockResolvedValue(encrypted);
    mockSecureGet.mockResolvedValue(keyHex);

    const store2 = new LargeSecureStore();
    await expect(store2.getItem('sb-test-auth-token')).resolves.toBe(session);
  });

  it('migrates a legacy SecureStore session on first read', async () => {
    const legacy = JSON.stringify({ access_token: 'old-jwt' });
    mockSecureGet.mockResolvedValue(legacy);

    const store = new LargeSecureStore();
    await expect(store.getItem('sb-test-auth-token')).resolves.toBe(legacy);

    expect(mockAsyncSet).toHaveBeenCalled();
    expect(mockSecureSet).toHaveBeenCalled();
  });

  it('serves cached reads without hitting storage again', async () => {
    const legacy = JSON.stringify({ access_token: 'cached' });
    mockSecureGet.mockResolvedValue(legacy);

    const store = new LargeSecureStore();
    await store.getItem('sb-test-auth-token');
    await store.getItem('sb-test-auth-token');

    expect(mockSecureGet).toHaveBeenCalledTimes(1);
    expect(mockAsyncGet).toHaveBeenCalledTimes(1);
  });

  it('clears both stores on removeItem', async () => {
    const store = new LargeSecureStore();
    await store.removeItem('sb-test-auth-token');

    expect(mockAsyncRemove).toHaveBeenCalledWith('sb-test-auth-token');
    expect(mockSecureDelete).toHaveBeenCalledWith('sb-test-auth-token');
  });

  it('returns null when no data exists in either store', async () => {
    mockAsyncGet.mockResolvedValue(null);
    mockSecureGet.mockResolvedValue(null);

    const store = new LargeSecureStore();
    await expect(store.getItem('sb-test-auth-token')).resolves.toBeNull();
  });

  it('returns null and caches it when secure store contains a non-legacy string', async () => {
    mockAsyncGet.mockResolvedValue(null);
    mockSecureGet.mockResolvedValue('random_hex_key');

    const store = new LargeSecureStore();
    await expect(store.getItem('sb-test-auth-token')).resolves.toBeNull();
  });
});
