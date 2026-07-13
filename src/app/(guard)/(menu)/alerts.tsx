import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { Button, Card, Field, Screen, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function GuardAlertsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [title, setTitle] = useState('Gate alert');
  const [body, setBody] = useState('');

  const raiseAlert = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !profile.society_id) throw new Error('Guard profile is not ready yet.');
      if (!body.trim()) throw new Error('Describe the alert before sending.');

      const { data: admin, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('society_id', profile.society_id)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!admin) throw new Error('No society admin found.');

      const { error } = await supabase.rpc('enqueue_notification', {
        p_body: body.trim(),
        p_category: 'alert',
        p_data: { raised_by: profile.id, source: 'guard_app' },
        p_profile_id: admin.id,
        p_title: title.trim() || 'Gate alert',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert('Alert sent', 'The society admin has been notified.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (error) => {
      Alert.alert('Could not send alert', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card accent="warning" className="gap-sm">
        <Text variant="headline">Raise a gate alert</Text>
        <Text variant="body" color="textSecondary">
          Use this for urgent gate issues that need admin attention.
        </Text>
      </Card>

      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Gate alert" />
      <Field
        label="Details"
        value={body}
        onChangeText={setBody}
        placeholder="Describe what happened"
        multiline
        textAlignVertical="top"
        style={{ minHeight: 120 }}
      />

      <Button label="Send alert" icon="warning_amber" loading={raiseAlert.isPending} onPress={() => raiseAlert.mutate()} />
    </Screen>
  );
}
