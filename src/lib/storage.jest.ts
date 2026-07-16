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

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn(),
      })),
    },
  },
}));

import * as FileSystem from 'expo-file-system/legacy';
import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';

import {
  createSignedUrl,
  isLocalUri,
  resolveStorageImageUri,
  signedUrlForPath,
  storageObjectPath,
  uniqueStorageObjectPaths,
  useSignedUrl,
  useSignedUrls,
  useStorageImageUri,
  useSignedUrlMap,
  useStorageImageUriMap,
  VISITOR_PHOTOS_BUCKET,
} from './storage';
import { createQueryWrapper } from '@/queries/__testUtils/queryTestUtils';

beforeEach(() => {
  jest.clearAllMocks();
  (supabase.storage.from as jest.Mock).mockReset();
  (supabase.storage.from as jest.Mock).mockReturnValue({
    createSignedUrl: jest.fn(),
  });
});

describe('storage helpers', () => {
  it('detects local device URIs', () => {
    expect(isLocalUri('file:///tmp/photo.jpg')).toBe(true);
    expect(isLocalUri('content://media/1')).toBe(true);
    expect(isLocalUri('https://cdn.test/photo.jpg')).toBe(false);
  });

  it('normalizes bare, prefixed, and signed storage paths', () => {
    const bucket = VISITOR_PHOTOS_BUCKET;
    expect(storageObjectPath('abc/def.jpg', bucket)).toBe('abc/def.jpg');
    expect(storageObjectPath(`${bucket}/abc/def.jpg`, bucket)).toBe('abc/def.jpg');
    expect(storageObjectPath(`/${bucket}/abc/def.jpg`, bucket)).toBe(`${bucket}/abc/def.jpg`);
    expect(
      storageObjectPath(
        `https://test.supabase.co/storage/v1/object/sign/${bucket}/abc%2Fdef.jpg?token=x`,
        bucket,
      ),
    ).toBe('abc/def.jpg');
    expect(storageObjectPath('file:///local.jpg', bucket)).toBe('file:///local.jpg');
    expect(storageObjectPath(null, bucket)).toBeNull();
  });

  it('deduplicates remote storage paths and skips local URIs', () => {
    const bucket = VISITOR_PHOTOS_BUCKET;
    expect(uniqueStorageObjectPaths(bucket, ['a/1.jpg', 'a/1.jpg', 'file:///x', null])).toEqual(['a/1.jpg']);
  });

  it('looks up signed urls by normalized object path', () => {
    const bucket = VISITOR_PHOTOS_BUCKET;
    const map = new Map([['a/1.jpg', 'https://signed.test/1']]);
    expect(signedUrlForPath(map, `${bucket}/a/1.jpg`, bucket)).toBe('https://signed.test/1');
    expect(signedUrlForPath(map, 'missing.jpg', bucket)).toBeUndefined();
  });

  it('creates a signed URL from storage', async () => {
    const createSignedUrlMock = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.test/photo.jpg' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });

    await expect(createSignedUrl(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).resolves.toBe(
      'https://signed.test/photo.jpg',
    );
  });

  it('returns cached local URIs without downloading', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).resolves.toBe(
      'file:///cache/visitor-photos--a__1.jpg.jpg',
    );
    expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
  });

  it('downloads and caches remote storage images', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    const createSignedUrlMock = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.test/photo.jpg' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
      status: 200,
      uri: 'file:///cache/visitor-photos--a__1.jpg.jpg',
    });

    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).resolves.toBe(
      'file:///cache/visitor-photos--a__1.jpg.jpg',
    );
  });
});

describe('storage hooks', () => {
  // Resets handled by global beforeEach

  it('fetches a signed URL for remote storage paths', async () => {
    const createSignedUrlMock = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.test/photo.jpg' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });

    const { result } = renderHook(() => useSignedUrl(VISITOR_PHOTOS_BUCKET, 'a/1.jpg'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://signed.test/photo.jpg');
  });

  it('skips signed URL queries for local URIs', () => {
    const { result } = renderHook(() => useSignedUrl(VISITOR_PHOTOS_BUCKET, 'file:///local.jpg'), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('resolves a local image URI through the storage image hook', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    const { result } = renderHook(() => useStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('file:///cache/visitor-photos--a__1.jpg.jpg');
  });

  it('handles invalid or non-matching paths in storageObjectPath', () => {
    const bucket = VISITOR_PHOTOS_BUCKET;
    expect(storageObjectPath('   ', bucket)).toBeNull();
    expect(storageObjectPath('http://other.com/abc.jpg', bucket)).toBeNull();
    expect(storageObjectPath('/abc/def.jpg', bucket)).toBe('abc/def.jpg');
    expect(storageObjectPath(`https://test.supabase.co/storage/v1/object/sign/${bucket}/abc%FFdef.jpg`, bucket)).toBe('abc%FFdef.jpg');
  });

  it('throws error when createSignedUrl fails', async () => {
    const createSignedUrlMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Signed URL error' },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });

    await expect(createSignedUrl(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).rejects.toEqual({ message: 'Signed URL error' });
  });

  it('resolveStorageImageUri throws when path is invalid', async () => {
    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, null as any)).rejects.toThrow('Invalid storage path');
  });

  it('resolveStorageImageUri returns local URI directly', async () => {
    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'file:///local.jpg')).resolves.toBe('file:///local.jpg');
  });

  it('resolveStorageImageUri throws when signing fails or download fails', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    const createSignedUrlMockErr = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Sign fail'),
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMockErr });

    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).rejects.toThrow('Sign fail');

    const createSignedUrlMockOk = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.test/photo.jpg' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMockOk });
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
      status: 500,
    });

    await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).rejects.toThrow('Download failed (500)');
  });

  describe('multi-URL hook utilities', () => {
    it('resolves useSignedUrlMap maps correctly', async () => {
      const createSignedUrlMock = jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed.test/photo.jpg' },
        error: null,
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });

      const { result } = renderHook(() => useSignedUrlMap(VISITOR_PHOTOS_BUCKET, ['a/1.jpg', 'b/2.jpg']), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.size).toBe(2));
      expect(result.current.get('a/1.jpg')).toBe('https://signed.test/photo.jpg');
    });

    it('resolves useStorageImageUriMap maps correctly', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      const { result } = renderHook(() => useStorageImageUriMap(VISITOR_PHOTOS_BUCKET, ['a/1.jpg', 'b/2.jpg']), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.map.get('a/1.jpg')).toBe('file:///cache/visitor-photos--a__1.jpg.jpg');
    });

    it('resolves useStorageImageUriMap errors correctly', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const createSignedUrlMock = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Map sign failure'),
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock });

      const { result } = renderHook(() => useStorageImageUriMap(VISITOR_PHOTOS_BUCKET, ['a/1.jpg']), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.errors.get('a/1.jpg')).toBeDefined();
    });

    it('handles decodeURIComponent failure in storageObjectPath', () => {
      const malformed = `https://test.supabase.co/storage/v1/object/sign/${VISITOR_PHOTOS_BUCKET}/%E0%A7`;
      expect(storageObjectPath(malformed, VISITOR_PHOTOS_BUCKET)).toBe('%E0%A7');
    });

    it('resolveStorageImageUri throws default sign error when data and error are empty', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const createSignedUrlMockEmpty = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMockEmpty });

      await expect(resolveStorageImageUri(VISITOR_PHOTOS_BUCKET, 'a/1.jpg')).rejects.toThrow('Could not sign photo URL');
    });

    it('handles null path in useStorageImageUri and useSignedUrl', () => {
      const { result: uriRes } = renderHook(() => useStorageImageUri(VISITOR_PHOTOS_BUCKET, null), {
        wrapper: createQueryWrapper(),
      });
      expect(uriRes.current.fetchStatus).toBe('idle');

      const { result: urlRes } = renderHook(() => useSignedUrl(VISITOR_PHOTOS_BUCKET, null), {
        wrapper: createQueryWrapper(),
      });
      expect(urlRes.current.fetchStatus).toBe('idle');
    });

    it('handles null paths in useSignedUrls and signedUrlForPath', () => {
      const { result } = renderHook(() => useSignedUrls(VISITOR_PHOTOS_BUCKET, [null as any]), {
        wrapper: createQueryWrapper(),
      });
      expect(result.current[0].fetchStatus).toBe('idle');

      const map = new Map<string, string>();
      map.set('a/1.jpg', 'https://signed.test/a/1.jpg');
      expect(signedUrlForPath(map, null, VISITOR_PHOTOS_BUCKET)).toBeUndefined();
    });
  });
});
