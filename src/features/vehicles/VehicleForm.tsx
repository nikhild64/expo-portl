import { Alert, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Chip, Field, Text } from '@/components';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useCreateVehicle } from '@/queries/useVehicles';

const vehicleSchema = z.object({
  color: z.string().optional(),
  model: z.string().optional(),
  plateNumber: z.string().min(3, 'Enter plate number'),
  type: z.enum(['car', 'bike', 'other']),
});

type VehicleInput = z.infer<typeof vehicleSchema>;
const types: VehicleInput['type'][] = ['car', 'bike', 'other'];

interface Props {
  onCreated?: () => void;
}

export function VehicleForm({ onCreated }: Props) {
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createVehicle = useCreateVehicle();
  const { control, handleSubmit, setValue, watch } = useForm<VehicleInput>({
    defaultValues: { color: '', model: '', plateNumber: '', type: 'car' },
    resolver: zodResolver(vehicleSchema),
  });
  const type = watch('type');

  const submit = async (input: VehicleInput) => {
    if (!primaryFlat?.flat_id) {
      Alert.alert('Flat required', 'Join a flat before adding vehicles.');
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
      Alert.alert('Could not add vehicle', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        TYPE
      </Text>
      <Controller
        control={control}
        name="type"
        render={() => (
          <View className="flex-row gap-sm">
            {types.map((item) => (
              <Chip key={item} label={item} selected={type === item} onPress={() => setValue('type', item)} />
            ))}
          </View>
        )}
      />
      <Field.Controlled control={control} name="plateNumber" label="Plate number" />
      <Field.Controlled control={control} name="model" label="Model" />
      <Field.Controlled control={control} name="color" label="Color" />
      <Button label="Add vehicle" loading={createVehicle.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
