import { ActivityIndicator, View } from 'react-native';
import { alert } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, EmptyState, ListRow, Screen, Text } from '@/components';
import { FamilyForm } from '@/features/family/FamilyForm';
import {
  flatResidentSubtitle,
  useDeleteFamilyMember,
  useFamily,
  useFlatResidents,
} from '@/queries/useFamily';

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { data: flatResidents = [], isLoading: flatResidentsLoading } = useFlatResidents();
  const { data: household = [], isLoading: householdLoading } = useFamily();
  const deleteFamilyMember = useDeleteFamilyMember();

  const isLoading = flatResidentsLoading || householdLoading;

  if (isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }

  const confirmDelete = (id: string) => {
    alert(t('alert.titles.deleteHouseholdMember'), t('alert.messages.removeHousehold'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteFamilyMember.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="gap-lg">
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.family.flatResidents')}
          </Text>
          {flatResidents.length ? (
            <Card padding="none" className="overflow-hidden">
              {flatResidents.map((member) => (
                <ListRow
                  key={member.profile_id}
                  left={<Avatar name={member.full_name} size="md" />}
                  title={member.full_name}
                  subtitle={flatResidentSubtitle(member)}
                />
              ))}
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="groups"
                title={t('resident.family.noFlatResidents')}
                subtitle={t('resident.family.noFlatResidentsSub')}
              />
            </Card>
          )}
        </View>

        <Card>
          <View className="gap-sm mb-md">
            <Text variant="headline">{t('resident.family.addHouseholdMember')}</Text>
            <Text variant="footnote" color="textSecondary">
              {t('resident.family.noFamilySub')}
            </Text>
          </View>
          <FamilyForm />
        </Card>

        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.family.householdMembers')}
          </Text>
          {household.length ? (
            <Card padding="none" className="overflow-hidden">
              {household.map((member) => (
                <ListRow
                  key={member.id}
                  title={member.name}
                  subtitle={`${member.relation ?? t('resident.family.relationFallback')}${member.age !== null ? ` - ${t('resident.family.ageYears', { age: member.age })}` : ''}`}
                  onLongPress={() => confirmDelete(member.id)}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              icon="person"
              title={t('resident.family.noMembers')}
              subtitle={t('resident.family.noMembersSub')}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
