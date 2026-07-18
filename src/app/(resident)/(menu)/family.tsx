import { useState } from 'react';
import { View } from 'react-native';
import { alertConfirmDestructive } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, EmptyState, ListRow, Screen, ScreenLoading, Text, StatusPill, Button } from '@/components';
import { FamilyForm } from '@/features/family/FamilyForm';
import {
  flatResidentSubtitle,
  useDeleteFamilyMember,
  useFamily,
  useFlatResidents,
} from '@/queries/useFamily';
import { useMyPrimaryFlat } from '@/queries/useMe';

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { data: flatResidents = [], isLoading: flatResidentsLoading } = useFlatResidents();
  const { data: household = [], isLoading: householdLoading } = useFamily();
  const { data: primaryFlat, isLoading: primaryFlatLoading } = useMyPrimaryFlat();
  const deleteFamilyMember = useDeleteFamilyMember();
  const [showForm, setShowForm] = useState(false);

  const isLoading = flatResidentsLoading || householdLoading || primaryFlatLoading;
  const isHead = !!primaryFlat?.is_head;

  if (isLoading) return <ScreenLoading variant="tab" />;

  const confirmDelete = (id: string) => {
    alertConfirmDestructive(
      t('alert.titles.deleteHouseholdMember'),
      t('alert.messages.removeHousehold'),
      () => deleteFamilyMember.mutate(id),
    );
  };

  return (
    <Screen scroll variant="tab">
      <View className="gap-lg">
        {isHead ? (
          !showForm ? (
            <Button
              label={t('resident.family.addHouseholdMember') || 'Add Member'}
              icon="add"
              onPress={() => setShowForm(true)}
            />
          ) : (
            <Card>
              <View className="flex-row items-center justify-between mb-md">
                <Text variant="headline">{t('resident.family.addHouseholdMember')}</Text>
                <Button
                  label={t('common.cancel') || 'Cancel'}
                  variant="text"
                  onPress={() => setShowForm(false)}
                />
              </View>
              <FamilyForm onCreated={() => setShowForm(false)} />
            </Card>
          )
        ) : null}

        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.family.householdMembers')}
          </Text>
          {flatResidents.length > 0 || household.length > 0 ? (
            <Card padding="none" className="overflow-hidden">
              {flatResidents.map((member) => (
                <ListRow
                  key={member.profile_id}
                  left={<Avatar name={member.full_name} size="md" />}
                  title={member.full_name}
                  subtitle={flatResidentSubtitle(member)}
                />
              ))}
              {household.map((member) => (
                <ListRow
                  key={member.id}
                  left={<Avatar name={member.name} size="md" />}
                  title={member.name}
                  subtitle={`${member.relation ?? t('resident.family.relationFallback')}${member.age !== null ? ` - ${t('resident.family.ageYears', { age: member.age })}` : ''}`}
                  right={
                    member.email ? (
                      <StatusPill
                        tone={member.consumed_at ? 'success' : 'neutral'}
                        label={member.consumed_at ? t('resident.family.appUser') : t('resident.family.pendingInvite')}
                      />
                    ) : undefined
                  }
                  onLongPress={isHead ? () => confirmDelete(member.id) : undefined}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              icon="groups"
              title={t('resident.family.noMembers')}
              subtitle={isHead ? t('resident.family.noMembersSub') : t('resident.family.noFlatResidentsSub')}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
