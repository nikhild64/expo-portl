import { ActivityIndicator, Alert, View } from 'react-native';

import { Avatar, Card, EmptyState, ListRow, Screen, Text } from '@/components';
import { FamilyForm } from '@/features/family/FamilyForm';
import {
  flatResidentSubtitle,
  useDeleteFamilyMember,
  useFamily,
  useFlatResidents,
} from '@/queries/useFamily';

export default function FamilyScreen() {
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
    Alert.alert('Delete household member?', 'This removes the saved record for someone without an app account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFamilyMember.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="gap-lg">
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            FLAT RESIDENTS
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
                title="No other residents on your flat"
                subtitle="When another person joins the same flat with an active account, they appear here automatically."
              />
            </Card>
          )}
        </View>

        <Card>
          <View className="gap-sm mb-md">
            <Text variant="headline">Add household member</Text>
            <Text variant="footnote" color="textSecondary">
              For family living with you who do not have a Portl account.
            </Text>
          </View>
          <FamilyForm />
        </Card>

        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            HOUSEHOLD MEMBERS
          </Text>
          {household.length ? (
            <Card padding="none" className="overflow-hidden">
              {household.map((member) => (
                <ListRow
                  key={member.id}
                  title={member.name}
                  subtitle={`${member.relation ?? 'Family'}${member.age !== null ? ` - ${member.age} yrs` : ''}`}
                  onLongPress={() => confirmDelete(member.id)}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              icon="person"
              title="No household members added"
              subtitle="Add children, parents, or other family who are not on the app."
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
