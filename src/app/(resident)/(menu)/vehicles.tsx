import { ActivityIndicator, View } from 'react-native';
import { alert } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, Text } from '@/components';
import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { titleize } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useDeleteVehicle, useVehicles } from '@/queries/useVehicles';

export default function VehiclesScreen() {
  const { t } = useTranslation();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles(flatIds);
  const deleteVehicle = useDeleteVehicle();

  if (flatLoading || vehiclesLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }

  const confirmDelete = (id: string) => {
    alert(t('alert.titles.deleteVehicle'), t('alert.messages.removeVehicle'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteVehicle.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card>
        <VehicleForm />
      </Card>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('resident.vehicles.myVehicles')}
        </Text>
        {vehicles.length ? (
          <Card padding="none" className="overflow-hidden">
            {vehicles.map((vehicle) => (
              <ListRow
                key={vehicle.id}
                title={vehicle.plate_number}
                subtitle={`${titleize(vehicle.type)}${vehicle.model ? ` - ${vehicle.model}` : ''}${vehicle.color ? ` - ${vehicle.color}` : ''}`}
                onLongPress={() => confirmDelete(vehicle.id)}
              />
            ))}
          </Card>
        ) : (
          <EmptyState icon="directions_car" title={t('resident.vehicles.noVehicles')} subtitle={t('resident.vehicles.noVehiclesSub')} />
        )}
      </View>
    </Screen>
  );
}
