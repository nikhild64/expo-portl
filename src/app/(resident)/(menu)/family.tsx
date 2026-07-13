import { ActivityIndicator, Alert, View } from 'react-native';

import { Card, EmptyState, ListRow, Screen, Text } from '@/components';
import { FamilyForm } from '@/features/family/FamilyForm';
import { useDeleteFamilyMember, useFamily } from '@/queries/useFamily';

export default function FamilyScreen() {
  const { data: family = [], isLoading } = useFamily();

  if (isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97066" />
        </View>
      </Screen>
    );
  }
  const deleteFamilyMember = useDeleteFamilyMember();

  const confirmDelete = (id: string) => {
    Alert.alert('Delete family member?', 'This removes the saved resident profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFamilyMember.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card>
        <FamilyForm />
      </Card>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          FAMILY MEMBERS
        </Text>
        {family.length ? (
          <Card padding="none" className="overflow-hidden">
            {family.map((member) => (
              <ListRow
                key={member.id}
                title={member.name}
                subtitle={`${member.relation ?? 'Family'}${member.age !== null ? ` - ${member.age} yrs` : ''}`}
                onLongPress={() => confirmDelete(member.id)}
              />
            ))}
          </Card>
        ) : (
          <EmptyState icon="groups" title="No family members" subtitle="Add family to keep resident records current." />
        )}
      </View>
    </Screen>
  );
}
