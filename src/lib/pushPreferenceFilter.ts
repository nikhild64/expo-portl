export type NotificationPreferenceColumn =
  | 'visitors'
  | 'notices'
  | 'polls'
  | 'payments'
  | 'complaints';

export type PushChannelId =
  | 'visitor-approval'
  | 'notices'
  | 'polls'
  | 'payments'
  | 'complaints'
  | string;

export type NotificationPreferenceRow = {
  profile_id: string;
  visitors?: boolean;
  notices?: boolean;
  polls?: boolean;
  payments?: boolean;
  complaints?: boolean;
};

/** Maps push channel ids to notification_preferences column names (push-fanout parity). */
export function preferenceColumnForChannel(channelId: PushChannelId): NotificationPreferenceColumn | null {
  switch (channelId) {
    case 'visitor-approval':
      return 'visitors';
    case 'notices':
      return 'notices';
    case 'polls':
      return 'polls';
    case 'payments':
      return 'payments';
    case 'complaints':
      return 'complaints';
    default:
      return null;
  }
}

export function filterProfileIdsByPreferences(
  profileIds: string[],
  channelId: PushChannelId,
  preferences: NotificationPreferenceRow[],
): string[] {
  const column = preferenceColumnForChannel(channelId);
  if (!column) return profileIds;

  const prefs = new Map(preferences.map((row) => [row.profile_id, row]));
  return profileIds.filter((id) => {
    const pref = prefs.get(id);
    if (!pref) return true;
    return pref[column] !== false;
  });
}
