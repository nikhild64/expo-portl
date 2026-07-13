import { Alert, Pressable, View } from 'react-native';
import { useState } from 'react';

import { Button, Card, Field, Text } from '@/components';
import { formatDateTime } from '@/lib/format';
import { useAddPollComment, useDeletePollComment, useUpdatePollComment } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  comments: Tables<'poll_comments'>[];
  pollId: string;
}

export function PollDiscussion({ comments, pollId }: Props) {
  const userId = useAuthStore((s) => s.session?.user.id);
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const addComment = useAddPollComment(pollId);
  const updateComment = useUpdatePollComment(pollId);
  const deleteComment = useDeletePollComment(pollId);

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
    } catch (error) {
      Alert.alert('Comment failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const startEdit = (comment: Tables<'poll_comments'>) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const saveEdit = async () => {
    if (!editingId || !editBody.trim()) return;
    try {
      await updateComment.mutateAsync({ id: editingId, body: editBody.trim() });
      cancelEdit();
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment.mutateAsync(id);
            if (editingId === id) cancelEdit();
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        DISCUSSION
      </Text>
      {comments.map((comment) => {
        const isOwn = comment.profile_id === userId;
        const isEditing = editingId === comment.id;

        return (
          <Card key={comment.id} variant="outlined" className="gap-xs">
            {isEditing ? (
              <>
                <Field value={editBody} onChangeText={setEditBody} multiline />
                <View className="flex-row gap-sm">
                  <Button label="Save" size="sm" loading={updateComment.isPending} onPress={saveEdit} />
                  <Button label="Cancel" size="sm" variant="outlined" onPress={cancelEdit} />
                </View>
              </>
            ) : (
              <>
                <Text variant="body">{comment.body}</Text>
                <View className="flex-row items-center justify-between gap-sm">
                  <Text variant="caption" color="textTertiary">
                    {formatDateTime(comment.created_at)}
                  </Text>
                  {isOwn && (
                    <View className="flex-row gap-md">
                      <Pressable onPress={() => startEdit(comment)} hitSlop={8}>
                        <Text variant="footnote" color="coral">
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => confirmDelete(comment.id)} hitSlop={8}>
                        <Text variant="footnote" color="error">
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </>
            )}
          </Card>
        );
      })}
      <Field value={body} onChangeText={setBody} placeholder="Add a comment" multiline />
      <Button label="Post comment" loading={addComment.isPending} onPress={submit} />
    </View>
  );
}
