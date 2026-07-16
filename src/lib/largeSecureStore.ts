import AsyncStorage from '@react-native-async-storage/async-storage';
import aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // Allows background token refresh without blocking on device lock (iOS).
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

function isLegacySession(value: string): boolean {
  const first = value.trimStart()[0];
  return first === '{' || first === '[';
}

/**
 * Supabase session storage for Expo: AES key in SecureStore, encrypted blob in AsyncStorage.
 * Avoids SecureStore's ~2KB limit and is faster than storing the full JWT payload in the keychain.
 */
export class LargeSecureStore {
  private cache = new Map<string, string | null>();

  private async encrypt(storageKey: string, value: string): Promise<string> {
    const encryptionKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(
      storageKey,
      aesjs.utils.hex.fromBytes(encryptionKey),
      secureStoreOptions,
    );

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(storageKey: string, encryptedHex: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(storageKey);
    if (!encryptionKeyHex || isLegacySession(encryptionKeyHex)) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encryptedHex));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(storageKey: string): Promise<string | null> {
    if (this.cache.has(storageKey)) return this.cache.get(storageKey) ?? null;

    const encrypted = await AsyncStorage.getItem(storageKey);
    if (encrypted) {
      const value = await this.decrypt(storageKey, encrypted);
      this.cache.set(storageKey, value);
      return value;
    }

    const legacy = await SecureStore.getItemAsync(storageKey);
    if (!legacy) {
      this.cache.set(storageKey, null);
      return null;
    }

    if (isLegacySession(legacy)) {
      this.cache.set(storageKey, legacy);
      void this.setItem(storageKey, legacy);
      return legacy;
    }

    this.cache.set(storageKey, null);
    return null;
  }

  async setItem(storageKey: string, value: string): Promise<void> {
    this.cache.set(storageKey, value);
    const encrypted = await this.encrypt(storageKey, value);
    await AsyncStorage.setItem(storageKey, encrypted);
  }

  async removeItem(storageKey: string): Promise<void> {
    this.cache.delete(storageKey);
    await AsyncStorage.removeItem(storageKey);
    await SecureStore.deleteItemAsync(storageKey);
  }
}
