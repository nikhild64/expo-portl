import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';

import { Button, Card, Chip, Field, Text } from '@/components';
import {
  defaultPreApprovalValues,
  preApprovalSchema,
  type PreApprovalInput,
} from '@/features/visitors/schemas';

const visitorTypes: { label: string; value: PreApprovalInput['type'] }[] = [
  { label: 'Guest', value: 'guest' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Cab', value: 'cab' },
  { label: 'Service', value: 'service' },
];

interface Props {
  loading?: boolean;
  onSubmit: (input: PreApprovalInput) => void;
}

export function PreApprovalForm({ loading, onSubmit }: Props) {
  const { control, handleSubmit, watch } = useForm<PreApprovalInput>({
    defaultValues: defaultPreApprovalValues(),
    resolver: zodResolver(preApprovalSchema),
  });
  const hasVehicle = watch('hasVehicle');

  return (
    <View className="gap-lg">
      <Card className="gap-md">
        <Text variant="caption" color="textSecondary">
          VISITOR TYPE
        </Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-sm">
              {visitorTypes.map((type) => (
                <Chip
                  key={type.value}
                  label={type.label}
                  selected={field.value === type.value}
                  onPress={() => field.onChange(type.value)}
                />
              ))}
            </View>
          )}
        />
      </Card>

      <Field.Controlled control={control} name="visitorName" label="Visitor name" placeholder="Amit Verma" />
      <Field.Controlled
        control={control}
        name="visitorPhone"
        label="Phone"
        placeholder="+91 98000 00000"
        keyboardType="phone-pad"
      />
      <Field.Controlled
        control={control}
        name="count"
        label="Guest count"
        keyboardType="number-pad"
        helper="Stored in notes for M4; dedicated count column can ship later."
      />
      <Field.Controlled control={control} name="startAt" label="Start time" helper="ISO date/time for now" />
      <Field.Controlled control={control} name="endAt" label="End time" helper="ISO date/time for now" />

      <Controller
        control={control}
        name="hasVehicle"
        render={({ field }) => (
          <Chip
            label={field.value ? 'Vehicle details added' : 'Add vehicle details'}
            selected={field.value}
            icon="directions_car"
            onPress={() => field.onChange(!field.value)}
          />
        )}
      />

      {hasVehicle && <Field.Controlled control={control} name="vehiclePlate" label="Vehicle plate" placeholder="DL 01 AB 1234" />}

      <Field.Controlled
        control={control}
        name="notes"
        label="Notes"
        placeholder="Anything the guard should know"
        multiline
      />

      <Button label="Create visitor QR" loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
