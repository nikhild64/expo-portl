import { Alert, View } from 'react-native';
import { useState } from 'react';

import { Button, Card, Field, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useAddComplaintComment } from '@/queries/useComplaints';
import type { Tables } from '@/types/database';

interface Props {
  complaintId: string;
  updates: Tables<'complaint_updates'>[];
}

export function CommentThread({ complaintId, updates }: Props) {
  const [body, setBody] = useState('');
  const addComment = useAddComplaintComment(complaintId);

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
        UPDATES
      </Text>
      {updates.map((update) => (
        <Card key={update.id} variant="outlined" className="gap-xs">
          <Text variant="caption" color="textSecondary">
            {titleize(update.kind)} - {formatDateTime(update.created_at)}
          </Text>
          <Text variant="body">{update.body}</Text>
        </Card>
      ))}
      <Field value={body} onChangeText={setBody} placeholder="Add an update or comment" multiline />
      <Button label="Send comment" loading={addComment.isPending} onPress={submit} />
    </View>
  );
}
