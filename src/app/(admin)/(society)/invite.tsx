import { useState } from 'react';
import { View } from 'react-native';
import { alertError, alertSuccess } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Field, Screen, SegmentedControl, Text, ThemeSwitch } from '@/components';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { formatFlatLabel } from '@/lib/format';
import { useInviteToFlat } from '@/queries/useAdminResidents';
import { useAuthStore } from '@/stores/authStore';

export default function AdminInviteFlatScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const params = useLocalSearchParams<{ flatId?: string; flatLabel?: string }>();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState(params.flatId ?? '');
  const [selectedFlatLabel, setSelectedFlatLabel] = useState(params.flatLabel ?? '');
  const [isOwner, setIsOwner] = useState(false);
  const [isHead, setIsHead] = useState(false);

  const inviteToFlat = useInviteToFlat();

  const handleSendInvite = async () => {
    if (!email.trim() || !selectedFlatId) return;

    let relation = 'resident';
    if (isOwner && isHead) relation = 'owner & head';
    else if (isOwner) relation = 'owner';
    else if (isHead) relation = 'head of family';

    try {
      await inviteToFlat.mutateAsync({
        email: email.trim(),
        flatId: selectedFlatId,
        name: name.trim() || email.trim(),
        relation,
      });

      alertSuccess(
        t('admin.society.inviteSent'),
        t('admin.society.inviteSentMessage', { email: email.trim(), flat: selectedFlatLabel || t('nav.screens.flat') }),
        [{ text: t('common.ok'), onPress: () => router.back() }],
      );
    } catch (error) {
      alertError(t('alert.titles.assignmentFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <Card className="gap-md">
        <View className="gap-xs">
          <Text variant="headline">{t('admin.society.inviteToFlat')}</Text>
          <Text variant="footnote" color="textSecondary">
            {t('admin.society.inviteEmailHelper')}
          </Text>
        </View>

        <Field
          label={t('common.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="user@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Field
          label={t('common.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('admin.society.inviteNamePlaceholder')}
        />

        <FlatSearchField
          fieldLabel={t('admin.society.assignFlat')}
          label={selectedFlatLabel}
          placeholder={t('admin.society.searchFlat')}
          societyId={societyId}
          value={selectedFlatId}
          onClear={() => {
            setSelectedFlatId('');
            setSelectedFlatLabel('');
          }}
          onSelect={(flat) => {
            setSelectedFlatId(flat.id);
            const label = formatFlatLabel(flat.tower_name, flat.number, t('nav.screens.flat'));
            setSelectedFlatLabel(`${label}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`);
          }}
        />

        <View className="gap-sm pt-sm">
          <Text variant="caption" color="textSecondary">
            {t('auth.joinSociety.occupancy')}
          </Text>
          <SegmentedControl
            segments={[
              { value: 'tenant', label: t('auth.joinSociety.tenant') },
              { value: 'owner', label: t('auth.joinSociety.owner') },
            ]}
            value={isOwner ? 'owner' : 'tenant'}
            onChange={(val) => setIsOwner(val === 'owner')}
          />
        </View>

        <View className="flex-row items-center justify-between gap-md pt-sm">
          <View className="flex-1">
            <Text variant="body">{t('auth.joinSociety.headOfFamily')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('admin.society.headOfFamilyHelper')}
            </Text>
          </View>
          <ThemeSwitch value={isHead} onValueChange={setIsHead} />
        </View>

        <Button
          label={t('admin.society.sendInviteBtn')}
          icon="send"
          disabled={!email.trim() || !selectedFlatId}
          loading={inviteToFlat.isPending}
          onPress={handleSendInvite}
        />
      </Card>
    </Screen>
  );
}
