import type { IconName } from '@/components/IconSymbol';
import i18n from '@/i18n';

export type NoticeReactionKey = 'thumb_up' | 'favorite' | 'volunteer_activism' | 'celebration';

export const NOTICE_REACTIONS: { key: NoticeReactionKey; icon: IconName; labelKey: string }[] = [
  { key: 'thumb_up', icon: 'thumb_up', labelKey: 'resident.community.reactions.like' },
  { key: 'favorite', icon: 'favorite', labelKey: 'resident.community.reactions.love' },
  { key: 'volunteer_activism', icon: 'volunteer_activism', labelKey: 'resident.community.reactions.thanks' },
  { key: 'celebration', icon: 'celebration', labelKey: 'resident.community.reactions.celebrate' },
];

export function noticeReactionLabel(reaction: (typeof NOTICE_REACTIONS)[number]) {
  return i18n.t(reaction.labelKey);
}

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
