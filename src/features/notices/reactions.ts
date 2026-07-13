import type { IconName } from '@/components/IconSymbol';

export type NoticeReactionKey = 'thumb_up' | 'favorite' | 'volunteer_activism' | 'celebration';

export const NOTICE_REACTIONS: { key: NoticeReactionKey; icon: IconName; label: string }[] = [
  { key: 'thumb_up', icon: 'thumb_up', label: 'Like' },
  { key: 'favorite', icon: 'favorite', label: 'Love' },
  { key: 'volunteer_activism', icon: 'volunteer_activism', label: 'Thanks' },
  { key: 'celebration', icon: 'celebration', label: 'Celebrate' },
];

const LEGACY_EMOJI_TO_KEY: Record<string, NoticeReactionKey> = {
  '👍': 'thumb_up',
  '❤️': 'favorite',
  '🙏': 'volunteer_activism',
  '👏': 'celebration',
};

export function normalizeReactionKey(value?: string | null): NoticeReactionKey | null {
  if (!value) return null;
  return (LEGACY_EMOJI_TO_KEY[value] ?? value) as NoticeReactionKey;
}

export function normalizeReactionCounts(counts?: Record<string, number>) {
  if (!counts) return {} as Record<NoticeReactionKey, number>;

  return Object.entries(counts).reduce<Record<NoticeReactionKey, number>>((next, [key, count]) => {
    const normalized = normalizeReactionKey(key);
    if (!normalized) return next;
    next[normalized] = (next[normalized] ?? 0) + count;
    return next;
  }, {} as Record<NoticeReactionKey, number>);
}
