import { useState } from 'react';
import { View } from 'react-native';
import { alertError, alertSuccess } from '@/lib/alert';

import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Field, Screen, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function GuardAlertsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const [title, setTitle] = useState(t('guard.alerts.placeholders.title'));
  const [body, setBody] = useState('');

  const presets = [
    { key: 'gateBlocked', label: t('guard.alerts.presets.gateBlocked') },
    { key: 'powerOutage', label: t('guard.alerts.presets.powerOutage') },
    { key: 'suspiciousActivity', label: t('guard.alerts.presets.suspiciousActivity') },
    { key: 'medicalEmergency', label: t('guard.alerts.presets.medicalEmergency') },
  ];

  const handlePresetPress = (label: string) => {
    if (body === label) {
      setBody('');
    } else {
      setBody(label);
    }
  };

  const raiseAlert = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !profile.society_id) throw new Error(t('guard.alerts.errors.profileNotReady'));

      const { data: admin, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('society_id', profile.society_id)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!admin) throw new Error(t('guard.alerts.errors.noAdmin'));

      const { error } = await supabase.rpc('enqueue_notification', {
        p_body: body.trim() || t('guard.alerts.defaultDetails'),
        p_category: 'alert',
        p_data: { raised_by: profile.id, source: 'guard_app', url: '/(admin)/(dashboard)/notifications' },
        p_profile_id: admin.id,
        p_title: title.trim() || t('guard.alerts.placeholders.title'),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      alertSuccess(t('alert.titles.alertSent'), t('alert.messages.adminNotified'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    },
    onError: (error) => {
      alertError(t('alert.titles.couldNotSendAlert'), error);
    },
  });

  return (
    <Screen scroll variant="tab">
      <Card className="gap-sm">
        <Text variant="headline">{t('guard.alerts.raiseGateAlert')}</Text>
        <Text variant="body" color="textSecondary">
          {t('guard.alerts.urgentNote')}
        </Text>
      </Card>

      <Field
        label={t('guard.alerts.alertTitle')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('guard.alerts.placeholders.title')}
      />

      <View className="mb-md gap-xs">
        <Text variant="subhead" color="textSecondary" className="font-semibold">
          {t('guard.alerts.quickSelectPreset')}
        </Text>
        <View className="flex-row flex-wrap gap-xs">
          {presets.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={body === item.label}
              onPress={() => handlePresetPress(item.label)}
            />
          ))}
        </View>
      </View>

      <Field
        label={t('guard.alerts.alertDetails')}
        value={body}
        onChangeText={setBody}
        placeholder={t('guard.alerts.placeholders.details')}
        multiline
        textAlignVertical="top"
        style={{ minHeight: 120 }}
      />

      <Button label={t('guard.alerts.sendAlert')} icon="warning_amber" loading={raiseAlert.isPending} onPress={() => raiseAlert.mutate()} />
    </Screen>
  );
}
