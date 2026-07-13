import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

import { getPasswordStrength } from '@/lib/passwordStrength';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  valid?: boolean;
  showStrength?: boolean;
  className?: string;
}

type ControlledFieldProps<T extends FieldValues> = Props & {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
};

const strengthSegmentClass = {
  weak: 'bg-error',
  fair: 'bg-warning',
  strong: 'bg-success',
} as const;

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!strength) return null;

  return (
    <View className="gap-xs">
      <View className="flex-row gap-xs">
        {[1, 2, 3, 4].map((segment) => (
          <View
            key={segment}
            className={`h-1 flex-1 rounded-pill ${
              segment <= strength.segments ? strengthSegmentClass[strength.level] : 'bg-border'
            }`}
          />
        ))}
      </View>
      <Text variant="caption" color="textSecondary">
        {strength.label}
      </Text>
    </View>
  );
}

function FieldBase({
  label,
  helper,
  error,
  valid,
  showStrength,
  onFocus,
  onBlur,
  className,
  secureTextEntry,
  value,
  ...rest
}: Props) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;
  const showSuccess = !!valid && !error && String(value ?? '').length > 0;
  const hasTrailingIcon = isPasswordField || showSuccess;
  const filled = String(value ?? '').length > 0;

  const borderClass = error
    ? 'border-error'
    : focused || filled
      ? 'border-coral'
      : 'border-border';

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
          value={value}
          secureTextEntry={isPasswordField && !passwordVisible}
          className={`min-h-[48px] rounded-md border bg-surface text-text-primary text-body px-md ${hasTrailingIcon ? 'pr-12' : ''} ${showSuccess && isPasswordField ? 'pr-20' : ''} ${borderClass}`}
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
        {showSuccess ? (
          <View
            className={`absolute top-0 h-[48px] items-center justify-center ${isPasswordField ? 'right-12 w-8' : 'right-0 w-12'}`}
          >
            <IconSymbol name="check_circle" size={20} color="success" />
          </View>
        ) : null}
        {isPasswordField ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? t('a11y.hidePassword') : t('a11y.showPassword')}
            hitSlop={8}
            className="absolute right-0 top-0 h-[48px] w-12 items-center justify-center"
          >
            <IconSymbol name={passwordVisible ? 'visibility_off' : 'visibility'} size={22} color="textSecondary" />
          </Pressable>
        ) : null}
      </View>
      {showStrength && isPasswordField ? <PasswordStrengthBar password={String(value ?? '')} /> : null}
      {(error || helper) && (
        <Text variant="footnote" color={error ? 'error' : 'textSecondary'}>
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}

function ControlledField<T extends FieldValues>({ control, name, rules, valid, ...rest }: ControlledFieldProps<T>) {
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
          valid={valid ?? (!fieldState.error && fieldState.isDirty && String(field.value ?? '').length > 0)}
        />
      )}
    />
  );
}

export const Field = Object.assign(FieldBase, {
  Controlled: ControlledField,
});
