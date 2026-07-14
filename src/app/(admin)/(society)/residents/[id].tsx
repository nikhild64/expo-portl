import { View } from 'react-native';
import { alertConfirm, alertError, alertSuccess } from '@/lib/alert';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, ScreenLoading, Text } from '@/components';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { ResidentForm, type ResidentFormValues } from '@/features/admin/ResidentForm';
import { formatFlatLabel } from '@/lib/format';
import { useAssignResidentFlat, useRemoveResidentFlat, useResidentDetail, useUpdateResident } from '@/queries/useAdminResidents';

export default function AdminResidentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: resident, isLoading } = useResidentDetail(id);
  const updateResident = useUpdateResident();
  const assignFlat = useAssignResidentFlat();
  const removeFlat = useRemoveResidentFlat();
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedFlatLabel, setSelectedFlatLabel] = useState('');

  if (isLoading || !resident) return <ScreenLoading variant="tab" />;

  const save = async (values: ResidentFormValues) => {
    try {
      await updateResident.mutateAsync({
        id: resident.id,
        patch: { full_name: values.fullName, phone: values.phone || null, status: values.status },
      });
      alertSuccess(t('alert.titles.residentUpdated'), t('alert.messages.changesSaved'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  const assign = async () => {
    if (!selectedFlatId) return;
    try {
      await assignFlat.mutateAsync({ flatId: selectedFlatId, profileId: resident.id });
      setSelectedFlatId('');
      setSelectedFlatLabel('');
    } catch (error) {
      alertError(t('alert.titles.assignmentFailed'), error, t('admin.society.chooseValidFlat'));
    }
  };

  const blockResident = () => {
    alertConfirm(t('alert.titles.blockResident'), t('alert.messages.blockedResidents'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.block'),
        style: 'destructive',
        onPress: () => updateResident.mutate({ id: resident.id, patch: { status: 'blocked' } }),
      },
    ]);
  };

  return (
    <Screen scroll variant="tab">
      <ResidentForm resident={resident} loading={updateResident.isPending} onSubmit={save} />

      <Card className="gap-md">
        <Text variant="headline">{t('admin.society.linkedFlats')}</Text>
        {resident.flat_residents?.map((link) => (
          <View key={link.flat_id} className="flex-row items-center justify-between gap-md">
            <View className="flex-1">
              <Text variant="body">
                {formatFlatLabel(link.flats?.towers?.name, link.flats?.number, link.flat_id)}
              </Text>
              <Text variant="caption" color="textSecondary">
                {link.is_owner ? t('auth.joinSociety.owner') : t('nav.screens.resident')}
                {link.is_head ? ` - ${t('auth.joinSociety.headOfFamily')}` : ''}
              </Text>
            </View>
            <Button label={t('common.remove')} size="sm" variant="text" onPress={() => removeFlat.mutate({ flatId: link.flat_id, profileId: resident.id })} />
          </View>
        ))}
        {!resident.flat_residents?.length && (
          <Text variant="body" color="textSecondary">
            {t('admin.society.noFlatLinked')}
          </Text>
        )}
        <FlatSearchField
          fieldLabel={t('admin.society.assignFlat')}
          label={selectedFlatLabel}
          placeholder={t('admin.society.searchFlat')}
          societyId={resident.society_id}
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
        <Button label={t('admin.society.assignSelectedFlat')} variant="tonal" disabled={!selectedFlatId} loading={assignFlat.isPending} onPress={assign} />
      </Card>

      <Button label={t('admin.society.blockResidentBtn')} variant="danger" icon="lock" loading={updateResident.isPending} onPress={blockResident} />
    </Screen>
  );
}
