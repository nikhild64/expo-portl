import { Alert, View } from 'react-native';

import { Chip, StatusPill } from '@/components';
import {
  useAddNoticeReaction,
  useMarkNoticeRead,
  useMyNoticeReaction,
  useNoticeRead,
  useNoticeReactions,
  useRemoveNoticeReaction,
} from '@/queries/useNoticeReactions';

const emojis = ['👍', '❤️', '🙏', '👏'];

interface Props {
  noticeId: string;
}

export function NoticeReactions({ noticeId }: Props) {
  const { data: counts } = useNoticeReactions(noticeId);
  const { data: myReaction } = useMyNoticeReaction(noticeId);
  const { data: read } = useNoticeRead(noticeId);
  const addReaction = useAddNoticeReaction(noticeId);
  const removeReaction = useRemoveNoticeReaction(noticeId);
  const markRead = useMarkNoticeRead(noticeId);

  const react = async (emoji: string) => {
    try {
      if (myReaction?.emoji === emoji) {
        await removeReaction.mutateAsync();
      } else {
        await addReaction.mutateAsync(emoji);
      }
    } catch (error) {
      Alert.alert('Reaction failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const acknowledge = async () => {
    try {
      await markRead.mutateAsync();
    } catch (error) {
      Alert.alert('Could not mark read', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-md">
      <View className="flex-row flex-wrap gap-sm">
        {emojis.map((emoji) => (
          <Chip
            key={emoji}
            label={`${emoji} ${counts?.[emoji] ?? 0}`}
            variant="assist"
            selected={myReaction?.emoji === emoji}
            onPress={() => react(emoji)}
          />
        ))}
      </View>
      <View className="flex-row">
        {read ? <StatusPill tone="success" label="Read" icon="check_circle" /> : <Chip label="Mark read" onPress={acknowledge} />}
      </View>
    </View>
  );
}
