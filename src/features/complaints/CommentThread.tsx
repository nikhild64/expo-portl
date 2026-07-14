import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { alertError } from '@/lib/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconSymbol, Text } from '@/components';
import { formatDateTime } from '@/lib/format';
import { useAddComplaintComment, type ComplaintUpdateWithProfile } from '@/queries/useComplaints';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  complaintId: string;
  updates: ComplaintUpdateWithProfile[];
  dark?: boolean;
  showInput?: boolean;
}

export function CommentInputBar({
  complaintId,
  dark = false,
}: {
  complaintId: string;
  dark?: boolean;
}) {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const addComment = useAddComplaintComment(complaintId);

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
    } catch (error) {
      alertError(t('alert.titles.commentFailed'), error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        className={`flex-row items-end gap-sm border-t border-border px-base py-sm ${dark ? 'bg-bg' : 'bg-surface'}`}
      >
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('resident.complaints.addComment')}
          placeholderTextColor="#8A7972"
          multiline
          className="max-h-24 min-h-[40px] flex-1 px-sm text-base text-text-primary"
          style={{ textAlignVertical: 'center' }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('a11y.sendComment')}
          disabled={!body.trim() || addComment.isPending}
          onPress={submit}
          className={`mb-0.5 h-10 w-10 items-center justify-center rounded-pill ${body.trim() ? 'bg-coral' : 'bg-surface-tertiary'}`}
        >
          <IconSymbol name="send" size={18} color={body.trim() ? 'onPrimary' : 'textTertiary'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export function CommentThread({ complaintId, updates, dark = false, showInput = true }: Props) {
  const { t } = useTranslation();
  const uid = useAuthStore((s) => s.session?.user.id);
  const comments = updates.filter((update) => update.kind === 'comment');

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        {t('resident.complaints.updates', { count: comments.length })}
      </Text>

      <View className="gap-sm">
        {comments.map((update) => {
          const mine = update.profile_id === uid;
          const author = update.profile?.full_name ?? t('resident.complaints.team');

          return (
            <View key={update.id} className={`max-w-[85%] gap-1 ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              {!mine ? (
                <Text variant="caption" color="textTertiary">
                  {author}
                </Text>
              ) : null}
              <View className={`rounded-lg px-md py-sm ${mine ? 'bg-coral' : dark ? 'bg-surface-tertiary' : 'bg-surface-secondary'}`}>
                <Text variant="body" color={mine ? 'onPrimary' : 'textPrimary'}>
                  {update.body}
                </Text>
              </View>
              <Text variant="caption" color="textTertiary">
                {formatDateTime(update.created_at)}
              </Text>
            </View>
          );
        })}
      </View>

      {showInput ? <CommentInputBar complaintId={complaintId} dark={dark} /> : null}
    </View>
  );
}
