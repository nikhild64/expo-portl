import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  className?: string;
}

type ControlledFieldProps<T extends FieldValues> = Props & {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
};

function FieldBase({ label, helper, error, onFocus, onBlur, className, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  const borderClass = error ? 'border-error' : focused ? 'border-coral' : 'border-border';

  return (
    <View className={`gap-xs${className ? ` ${className}` : ''}`}>
      {label && (
        <Text variant="footnote" color="textSecondary">
          {label}
        </Text>
      )}
      <TextInput
        {...rest}
        placeholderTextColorClassName="accent-text-tertiary"
        className={`min-h-[48px] px-md rounded-md border bg-surface text-text-primary text-body ${borderClass}`}
        style={{ borderCurve: 'continuous', fontFamily: 'RobotoFlex-Regular' }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
      {(error || helper) && (
        <Text variant="footnote" color={error ? 'error' : 'textSecondary'}>
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}

function ControlledField<T extends FieldValues>({ control, name, rules, ...rest }: ControlledFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FieldBase
          {...rest}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export const Field = Object.assign(FieldBase, {
  Controlled: ControlledField,
});
