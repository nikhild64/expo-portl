import { Alert, View } from 'react-native';
import { useState } from 'react';

import { Button, Card, Field, Text } from '@/components';
import { formatDateTime } from '@/lib/format';
import { useAddPollComment } from '@/queries/usePolls';
import type { Tables } from '@/types/database';

interface Props {
  comments: Tables<'poll_comments'>[];
  pollId: string;
}

export function PollDiscussion({ comments, pollId }: Props) {
  const [body, setBody] = useState('');
  const addComment = useAddPollComment(pollId);

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
    } catch (error) {
      Alert.alert('Comment failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        DISCUSSION
      </Text>
      {comments.map((comment) => (
        <Card key={comment.id} variant="outlined" className="gap-xs">
          <Text variant="body">{comment.body}</Text>
          <Text variant="caption" color="textTertiary">
            {formatDateTime(comment.created_at)}
          </Text>
        </Card>
      ))}
      <Field value={body} onChangeText={setBody} placeholder="Add a comment" multiline />
      <Button label="Post comment" loading={addComment.isPending} onPress={submit} />
    </View>
  );
}
