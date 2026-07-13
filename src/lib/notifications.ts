import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

export type NotificationChannelId =
  | 'visitor-approval'
  | 'notices'
  | 'polls'
  | 'complaints'
  | 'payments';

// SDK 55 removed shouldShowAlert in favor of shouldShowBanner + shouldShowList.
// Foreground notifications appear as a silent banner so the user still sees
// them without an intrusive alert while inside the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

interface ChannelConfig {
  id: NotificationChannelId;
  name: string;
  importance: Notifications.AndroidImportance;
  description?: string;
  vibrationPattern?: number[];
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'visitor-approval',
    name: 'Visitor approvals',
    description: 'Guard requests waiting for approval at the gate.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  },
  {
    id: 'notices',
    name: 'Notices',
    description: 'Announcements from the society office.',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: 'polls',
    name: 'Polls',
    description: 'New polls and voting reminders.',
    importance: Notifications.AndroidImportance.LOW,
  },
  {
    id: 'complaints',
    name: 'Complaints',
    description: 'Status changes and comments on your complaints.',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Dues and payment confirmations.',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
];

let channelsRegistered = false;
let lastRegisteredKey: string | null = null;

/**
 * Registers the 5 Android notification channels. Safe to call multiple times.
 * On Android 13+ this must run before requesting the push token so the OS
 * knows to surface the permission prompt.
 */
export async function setupNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (channelsRegistered) return;

  await Promise.all(
    CHANNELS.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        description: channel.description,
        vibrationPattern: channel.vibrationPattern,
      }),
    ),
  );

  channelsRegistered = true;
}

/**
 * Requests permission, obtains the Expo push token for the current device,
 * and upserts it into `push_tokens` scoped to the given profile.
 *
 * Silent no-op when:
 *   - Permission is denied
 *   - `Constants.expoConfig.extra.eas.projectId` is missing (before `eas init`)
 *   - Already registered for this profile in the current app session
 */
export async function registerPushToken(profileId: string): Promise<void> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] missing EAS projectId — run `eas init` first');
    return;
  }

  const sessionKey = `${profileId}:${projectId}`;
  if (lastRegisteredKey === sessionKey) return;

  await setupNotifications();

  if (!Device.isDevice) {
    console.debug('[push] emulator detected — push may only work with Google Play services');
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    console.warn('[push] permission denied');
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.from('push_tokens').upsert(
      {
        profile_id: profileId,
        expo_token: token,
        device_id: Device.deviceName ?? Device.modelName ?? 'unknown',
        platform: Platform.OS,
        active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'expo_token' },
    );
    if (error) {
      console.warn('[push] failed to upsert token', error.message);
      return;
    }
    lastRegisteredKey = sessionKey;
  } catch (error) {
    if (!Device.isDevice) {
      console.debug('[push] token unavailable on this emulator — use a physical device to test push');
      return;
    }
    console.warn('[push] failed to obtain token', error);
  }
}

/**
 * Marks the current device's Expo push token inactive so the fan-out function
 * stops targeting it. Called on sign-out.
 */
export async function unregisterPushToken(): Promise<void> {
  lastRegisteredKey = null;
  if (!Device.isDevice) return;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').update({ active: false }).eq('expo_token', token);
  } catch {
    // ignore — we've already signed out on the client, this is best-effort cleanup
  }
}
