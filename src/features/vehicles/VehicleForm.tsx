import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Chip, Field, Text } from '@/components';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useCreateVehicle } from '@/queries/useVehicles';

function createVehicleSchema(t: TFunction) {
  return z.object({
    color: z.string().optional(),
    model: z.string().optional(),
    plateNumber: z.string().min(3, t('validation.vehiclePlateRequired')),
    type: z.enum(['car', 'bike', 'other']),
  });
}

type VehicleInput = z.infer<ReturnType<typeof createVehicleSchema>>;
const types: VehicleInput['type'][] = ['car', 'bike', 'other'];

interface Props {
  onCreated?: () => void;
}

export function VehicleForm({ onCreated }: Props) {
  const { t } = useTranslation();
  const vehicleSchema = useMemo(() => createVehicleSchema(t), [t]);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createVehicle = useCreateVehicle();
  const { control, handleSubmit, setValue, watch } = useForm<VehicleInput>({
    defaultValues: { color: '', model: '', plateNumber: '', type: 'car' },
    resolver: zodResolver(vehicleSchema),
  });
  const type = watch('type');

  const submit = async (input: VehicleInput) => {
    if (!primaryFlat?.flat_id) {
      alert(t('alert.titles.flatRequired'), t('alert.messages.joinFlatVehicles'));
      return;
    }
    try {
      await createVehicle.mutateAsync({
        color: input.color || null,
        flat_id: primaryFlat.flat_id,
        model: input.model || null,
        plate_number: input.plateNumber.trim().toUpperCase(),
        type: input.type,
      });
      onCreated?.();
    } catch (error) {
      alert(
        t('alert.titles.couldNotAddVehicle'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    }
  };

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        {t('resident.vehicles.type')}
      </Text>
      <Controller
        control={control}
        name="type"
        render={() => (
          <View className="flex-row gap-sm">
            {types.map((item) => (
              <Chip
                key={item}
                label={t(`resident.vehicles.types.${item}`)}
                selected={type === item}
                onPress={() => setValue('type', item)}
              />
            ))}
          </View>
        )}
      />
      <Field.Controlled control={control} name="plateNumber" label={t('resident.vehicles.plateNumber')} />
      <Field.Controlled control={control} name="model" label={t('resident.vehicles.model')} />
      <Field.Controlled control={control} name="color" label={t('resident.vehicles.color')} />
      <Button label={t('resident.vehicles.addVehicle')} loading={createVehicle.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
