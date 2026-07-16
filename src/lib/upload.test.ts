const mockUpload = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: (...args: unknown[]) => mockUpload(...args),
      })),
    },
  },
}));

import { uploadToStorage } from './upload';

describe('uploadToStorage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uploads fetched image bytes to the target bucket path', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes,
    });
    mockUpload.mockResolvedValue({ data: { path: 'photos/abc.jpg' }, error: null });

    const path = await uploadToStorage('visitor-photos', 'file:///tmp/photo.jpg', 'photos/abc.jpg');

    expect(global.fetch).toHaveBeenCalledWith('file:///tmp/photo.jpg');
    expect(mockUpload).toHaveBeenCalledWith('photos/abc.jpg', bytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    expect(path).toBe('photos/abc.jpg');
  });

  it('throws when the local file cannot be read', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    await expect(uploadToStorage('visitor-photos', 'file:///missing.jpg', 'x.jpg')).rejects.toThrow(
      'Could not read image (404)',
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('throws when supabase upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    mockUpload.mockResolvedValue({ data: null, error: { message: 'denied' } });

    await expect(uploadToStorage('visitor-photos', 'file:///tmp/photo.jpg', 'x.jpg')).rejects.toEqual({
      message: 'denied',
    });
  });
});
