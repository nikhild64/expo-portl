import { View } from 'react-native';
import { alertError } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Chip, StatusPill } from '@/components';
import {
  useAddNoticeReaction,
  useMarkNoticeRead,
  useMyNoticeReaction,
  useNoticeRead,
  useNoticeReactions,
  useRemoveNoticeReaction,
} from '@/queries/useNoticeReactions';

import { NOTICE_REACTIONS, normalizeReactionCounts, normalizeReactionKey, noticeReactionLabel, type NoticeReactionKey } from './reactions';

interface Props {
  noticeId: string;
}

export function NoticeReactions({ noticeId }: Props) {
  const { t } = useTranslation();
  const { data: counts } = useNoticeReactions(noticeId);
  const { data: myReaction } = useMyNoticeReaction(noticeId);
  const { data: read } = useNoticeRead(noticeId);
  const addReaction = useAddNoticeReaction(noticeId);
  const removeReaction = useRemoveNoticeReaction(noticeId);
  const markRead = useMarkNoticeRead(noticeId);
  const normalizedCounts = normalizeReactionCounts(counts);
  const myReactionKey = normalizeReactionKey(myReaction?.emoji);

  const react = async (reactionKey: NoticeReactionKey) => {
    try {
      if (myReactionKey === reactionKey) {
        await removeReaction.mutateAsync();
      } else {
        await addReaction.mutateAsync(reactionKey);
      }
    } catch (error) {
      alertError(t('alert.titles.reactionFailed'), error);
    }
  };

  const acknowledge = async () => {
    try {
      await markRead.mutateAsync();
    } catch (error) {
      alertError(t('alert.titles.couldNotMarkRead'), error);
    }
  };

  return (
    <View className="gap-md">
      <View className="flex-row flex-wrap gap-sm">
        {NOTICE_REACTIONS.map((reaction) => {
          const count = normalizedCounts[reaction.key] ?? 0;
          const label = noticeReactionLabel(reaction);

          return (
            <Chip
              key={reaction.key}
              icon={reaction.icon}
              count={count}
              label=""
              variant="assist"
              selected={myReactionKey === reaction.key}
              accessibilityLabel={`${label}, ${count}`}
              onPress={() => react(reaction.key)}
            />
          );
        })}
      </View>
      <View className="flex-row">
        {read ? (
          <StatusPill tone="success" label={t('common.read')} icon="check_circle" />
        ) : (
          <Chip label={t('resident.community.markRead')} onPress={acknowledge} />
        )}
      </View>
    </View>
  );
}
