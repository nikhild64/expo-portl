import { View } from 'react-native';
import { alertConfirmDestructive } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, Text } from '@/components';
import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { titleize } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useDeleteVehicle, useVehicles } from '@/queries/useVehicles';

export default function VehiclesScreen() {
  const { t } = useTranslation();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles(flatIds);
  const deleteVehicle = useDeleteVehicle();

  if (flatLoading || vehiclesLoading) return <ScreenLoading variant="tab" />;

  const confirmDelete = (id: string) => {
    alertConfirmDestructive(t('alert.titles.deleteVehicle'), t('alert.messages.removeVehicle'), () =>
      deleteVehicle.mutate(id),
    );
  };

  return (
    <Screen scroll variant="tab">
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
