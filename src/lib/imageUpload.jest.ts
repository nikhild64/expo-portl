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

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn.test/public.jpg' } })),
      })),
    },
  },
}));

const mockAlert = jest.fn();

jest.mock('@/lib/alert', () => ({
  alert: (...args: unknown[]) => mockAlert(...args),
}));

const mockUpload = jest.fn();

jest.mock('./upload', () => ({
  uploadToStorage: (...args: unknown[]) => mockUpload(...args),
}));

const mockManipulate = jest.fn();
const mockResize = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: (...args: unknown[]) => mockManipulate(...args),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: (...args: unknown[]) => mockRequestCameraPermissionsAsync(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

import {
  compressImage,
  pickGalleryPhotos,
  pickImageSource,
  pickImageSourceI18n,
  storageImagePath,
  takeCameraPhoto,
  uploadPrivateImage,
  uploadPublicImage,
} from './imageUpload';

describe('imageUpload helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const mockBuilder = {
      resize: mockResize,
      renderAsync: mockRenderAsync,
    };
    mockManipulate.mockReturnValue(mockBuilder);
    mockResize.mockReturnValue(mockBuilder);
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockSaveAsync.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue('photos/abc.jpg');
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///camera.jpg' }],
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///gallery-1.jpg' }, { uri: 'file:///gallery-2.jpg' }],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('storageImagePath', () => {
    it('returns a unique jpg filename without a prefix', () => {
      expect(storageImagePath()).toMatch(/^\d+-[a-z0-9]+\.jpg$/);
    });

    it('prefixes the generated path when provided', () => {
      expect(storageImagePath('avatars')).toMatch(/^avatars\/\d+-[a-z0-9]+\.jpg$/);
    });
  });

  describe('pickImageSource', () => {
    it('invokes onCamera when the take-photo button is pressed', () => {
      const onCamera = jest.fn();
      const onGallery = jest.fn();

      pickImageSource({
        title: 'Add photo',
        message: 'Choose a source',
        takePhotoLabel: 'Camera',
        galleryLabel: 'Gallery',
        cancelLabel: 'Cancel',
        onCamera,
        onGallery,
      });

      const buttons = mockAlert.mock.calls[0]?.[2] as Array<{ onPress?: () => void }>;
      buttons[0]?.onPress?.();
      expect(onCamera).toHaveBeenCalled();
      expect(onGallery).not.toHaveBeenCalled();
    });

    it('invokes onGallery when the gallery button is pressed', () => {
      const onCamera = jest.fn();
      const onGallery = jest.fn();

      pickImageSource({
        title: 'Add photo',
        message: 'Choose a source',
        takePhotoLabel: 'Camera',
        galleryLabel: 'Gallery',
        cancelLabel: 'Cancel',
        onCamera,
        onGallery,
      });

      const buttons = mockAlert.mock.calls[0]?.[2] as Array<{ onPress?: () => void }>;
      buttons[1]?.onPress?.();
      expect(onGallery).toHaveBeenCalled();
    });
  });

  describe('pickImageSourceI18n', () => {
    it('uses translated button labels', () => {
      const t = ((key: string) => key) as any;
      const onCamera = jest.fn();
      const onGallery = jest.fn();

      pickImageSourceI18n(t, {
        titleKey: 'alert.titles.addPhoto',
        messageKey: 'alert.messages.addPhoto',
        onCamera,
        onGallery,
      });

      const buttons = mockAlert.mock.calls[0]?.[2] as Array<{ text?: string }>;
      expect(buttons[0]?.text).toBe('alert.buttons.takePhoto');
    });
  });

  describe('compressImage', () => {
    it('resizes and saves a JPEG with the requested width', async () => {
      const result = await compressImage('file:///original.jpg', { width: 800, compress: 0.7 });

      expect(mockManipulate).toHaveBeenCalledWith('file:///original.jpg');
      expect(mockResize).toHaveBeenCalledWith({ width: 800 });
      expect(mockSaveAsync).toHaveBeenCalledWith({ compress: 0.7, format: 'jpeg' });
      expect(result).toEqual({ uri: 'file:///compressed.jpg' });
    });
  });

  describe('uploadPrivateImage', () => {
    it('compresses, uploads, and returns the storage path', async () => {
      const path = await uploadPrivateImage('visitor-photos', 'file:///original.jpg', {
        prefix: 'visitors',
        width: 640,
      });

      expect(mockUpload).toHaveBeenCalledWith('visitor-photos', 'file:///compressed.jpg', expect.stringMatching(/^visitors\//));
      expect(path).toMatch(/^visitors\//);
    });

    it('uploads directly without compression when width is not specified', async () => {
      const path = await uploadPrivateImage('visitor-photos', 'file:///original.jpg', {
        prefix: 'visitors',
      });

      expect(mockUpload).toHaveBeenCalledWith('visitor-photos', 'file:///original.jpg', expect.stringMatching(/^visitors\//));
      expect(path).toMatch(/^visitors\//);
    });
  });

  describe('uploadPublicImage', () => {
    it('uploads and returns the public URL', async () => {
      const url = await uploadPublicImage('society-logos', 'file:///logo.jpg', 'logos/a.jpg', { width: 256 });

      expect(url).toBe('https://cdn.test/public.jpg');
    });

    it('uploads directly without compression when width is not specified', async () => {
      const url = await uploadPublicImage('society-logos', 'file:///logo.jpg', 'logos/a.jpg');

      expect(mockUpload).toHaveBeenCalledWith('society-logos', 'file:///logo.jpg', 'logos/a.jpg');
      expect(url).toBe('https://cdn.test/public.jpg');
    });
  });

  describe('takeCameraPhoto', () => {
    it('returns null when camera permission is denied', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: false });

      await expect(takeCameraPhoto()).resolves.toBeNull();
      expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
    });

    it('returns the captured photo URI', async () => {
      await expect(takeCameraPhoto()).resolves.toBe('file:///camera.jpg');
    });

    it('returns null when the user cancels capture', async () => {
      mockLaunchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });

      await expect(takeCameraPhoto()).resolves.toBeNull();
    });

    it('returns null when capture succeeds but assets list is empty', async () => {
      mockLaunchCameraAsync.mockResolvedValue({ canceled: false, assets: [] });

      await expect(takeCameraPhoto()).resolves.toBeNull();
    });
  });

  describe('pickGalleryPhotos', () => {
    it('returns selected gallery URIs', async () => {
      await expect(pickGalleryPhotos({ allowsMultipleSelection: true })).resolves.toEqual([
        'file:///gallery-1.jpg',
        'file:///gallery-2.jpg',
      ]);
    });

    it('returns an empty array when selection is canceled', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

      await expect(pickGalleryPhotos()).resolves.toEqual([]);
    });
  });
});
