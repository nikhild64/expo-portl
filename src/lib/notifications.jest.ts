const mockSetNotificationHandler = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockRpc = jest.fn();

let mockPlatformOs = 'android';
let mockIsDevice = true;
let mockProjectId: string | undefined = 'proj-1';

jest.mock('react-native', () => ({
  Platform: { get OS() { return mockPlatformOs; } },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { get projectId() { return mockProjectId; } } } },
    easConfig: { get projectId() { return mockProjectId; } },
  },
}));

jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
  deviceName: 'Pixel',
  modelName: 'Pixel 8',
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2 },
}));

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

async function loadNotifications() {
  jest.resetModules();
  return require('./notifications');
}

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOs = 'android';
    mockIsDevice = true;
    mockProjectId = 'proj-1';
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    mockRpc.mockResolvedValue({ error: null });
  });

  it('registers a foreground handler that plays sound for urgent channels', async () => {
    await loadNotifications();

    expect(mockSetNotificationHandler).toHaveBeenCalled();
    const handler = mockSetNotificationHandler.mock.calls[0]?.[0];
    const urgent = await handler.handleNotification({
      request: { content: { data: { channelId: 'visitor-approval' } } },
    });
    const silent = await handler.handleNotification({
      request: { content: { data: { channelId: 'notices' } } },
    });

    expect(urgent).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
    expect(silent.shouldPlaySound).toBe(false);
  });

  it('registers Android notification channels once', async () => {
    const mod = await loadNotifications();

    await mod.setupNotifications();
    await mod.setupNotifications();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(5);
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
      'visitor-approval',
      expect.objectContaining({ name: 'notifications.channels.visitorApprovals' }),
    );
  });

  it('skips channel setup on iOS', async () => {
    mockPlatformOs = 'ios';
    const mod = await loadNotifications();

    await mod.setupNotifications();

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('no-ops registerPushToken when projectId is missing', async () => {
    mockProjectId = undefined;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mod = await loadNotifications();

    await mod.registerPushToken('profile-1');

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[push] missing EAS projectId — run `eas init` first');
    warn.mockRestore();
  });

  it('registers push token and upserts it for the profile', async () => {
    const mod = await loadNotifications();

    await mod.registerPushToken('profile-1');

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
    expect(mockRpc).toHaveBeenCalledWith('register_push_token', {
      p_expo_token: 'ExponentPushToken[abc]',
      p_device_id: 'Pixel',
      p_platform: 'android',
    });
  });

  it('skips duplicate registration for the same profile session', async () => {
    const mod = await loadNotifications();

    await mod.registerPushToken('profile-1');
    await mod.registerPushToken('profile-1');

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(1);
  });

  it('re-registers when force is true', async () => {
    const mod = await loadNotifications();

    await mod.registerPushToken('profile-1');
    await mod.registerPushToken('profile-1', { force: true });

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(2);
  });

  it('returns early when permission is denied', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mod = await loadNotifications();

    await mod.registerPushToken('profile-1');

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[push] permission denied');
    warn.mockRestore();
  });

  it('deactivates push token on unregister', async () => {
    const mod = await loadNotifications();

    await mod.unregisterPushToken();

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('deactivate_push_token', {
      p_expo_token: 'ExponentPushToken[abc]',
    });
  });

  it('skips unregister on emulators', async () => {
    mockIsDevice = false;
    const mod = await loadNotifications();

    await mod.unregisterPushToken();

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('covers emulator logs and registration error checks', async () => {
    mockIsDevice = false;
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const mod = await loadNotifications();
    await mod.registerPushToken('profile-1');
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('emulator detected'));
    debug.mockRestore();

    mockIsDevice = true;
    mockRpc.mockResolvedValue({ error: new Error('DB connection failed') });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await mod.registerPushToken('profile-1', { force: true });
    expect(warn).toHaveBeenCalledWith('[push] failed to upsert token', 'DB connection failed');
    warn.mockRestore();
  });

  it('covers token getter throwing exceptions', async () => {
    mockIsDevice = false;
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('Token call failed'));
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const mod = await loadNotifications();
    await mod.registerPushToken('profile-1', { force: true });
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('token unavailable on this emulator'));
    debug.mockRestore();

    mockIsDevice = true;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await mod.registerPushToken('profile-1', { force: true });
    expect(warn).toHaveBeenCalledWith('[push] failed to obtain token', expect.any(Error));
    warn.mockRestore();
  });

  it('covers exceptions and missing project ID in unregisterPushToken', async () => {
    mockIsDevice = true;
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('Token call failed'));
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const mod = await loadNotifications();

    await mod.unregisterPushToken();
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('unregister failed'), expect.any(Error));

    mockProjectId = undefined;
    mockGetExpoPushTokenAsync.mockClear();
    await mod.unregisterPushToken();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();

    debug.mockRestore();
  });
});
