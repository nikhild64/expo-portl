import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';

const schema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  phone: z.string().optional(),
});

export type GuardFormValues = z.infer<typeof schema>;

interface Props {
  loading?: boolean;
  onSubmit: (values: GuardFormValues) => void;
}

export function GuardForm({ loading, onSubmit }: Props) {
  const { control, handleSubmit } = useForm<GuardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  return (
    <Card className="gap-md">
      <ViewHeader />
      <Field.Controlled control={control} name="fullName" label="Full name" autoCapitalize="words" />
      <Field.Controlled
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field.Controlled
        control={control}
        name="password"
        label="Temporary password"
        secureTextEntry
        autoComplete="new-password"
        helper="Share this with the guard. They can change it after signing in."
      />
      <Field.Controlled
        control={control}
        name="phone"
        label="Phone"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <Button label="Create guard account" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}

function ViewHeader() {
  return (
    <>
      <Text variant="headline">New guard account</Text>
      <Text variant="body" color="textSecondary">
        Creates an active guard login for your society. The guard can sign in immediately.
      </Text>
    </>
  );
}
