import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

import { IconSymbol } from './IconSymbol';
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

function FieldBase({ label, helper, error, onFocus, onBlur, className, secureTextEntry, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;

  const borderClass = error ? 'border-error' : focused ? 'border-coral' : 'border-border';

  return (
    <View className={`gap-xs${className ? ` ${className}` : ''}`}>
      {label && (
        <Text variant="footnote" color="textSecondary">
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          {...rest}
          secureTextEntry={isPasswordField && !passwordVisible}
          className={`min-h-[48px] rounded-md border bg-surface text-text-primary text-body px-md ${isPasswordField ? 'pr-12' : ''} ${borderClass}`}
          placeholderTextColorClassName="accent-text-tertiary"
          style={{
            borderCurve: 'continuous',
            fontFamily: 'RobotoFlex-Regular',
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {isPasswordField ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            className="absolute right-0 top-0 h-[48px] w-12 items-center justify-center"
          >
            <IconSymbol name={passwordVisible ? 'visibility_off' : 'visibility'} size={22} color="textSecondary" />
          </Pressable>
        ) : null}
      </View>
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
