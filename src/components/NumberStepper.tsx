import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

function clamp(value: number, min: number, max?: number) {
  let next = Math.max(min, value);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

function parseInput(text: string, fallback: number, min: number, max?: number) {
  const digits = text.replace(/\D/g, '');
  if (!digits) return fallback;
  return clamp(Number.parseInt(digits, 10), min, max);
}

export function NumberStepper({ label, value, onChange, min = 0, max, step = 1, disabled }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (next: number) => {
    const clamped = clamp(next, min, max);
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <View className="gap-xs">
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <View className="min-h-[48px] flex-row items-center rounded-md border border-border bg-surface">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onPress={() => commit(value - step)}
          className="h-12 w-12 items-center justify-center"
        >
          <IconSymbol name="remove" size={20} color={disabled || value <= min ? 'textTertiary' : 'textPrimary'} />
        </Pressable>

        <TextInput
          value={draft}
          editable={!disabled}
          keyboardType="number-pad"
          onChangeText={(text) => {
            setDraft(text.replace(/\D/g, ''));
            if (text.replace(/\D/g, '')) {
              onChange(parseInput(text, value, min, max));
            }
          }}
          onBlur={() => commit(parseInput(draft, value, min, max))}
          className="min-w-[48px] flex-1 text-center text-base text-text-primary"
          selectTextOnFocus
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          disabled={disabled || (max !== undefined && value >= max)}
          onPress={() => commit(value + step)}
          className="h-12 w-12 items-center justify-center"
        >
          <IconSymbol name="add" size={20} color={disabled || (max !== undefined && value >= max) ? 'textTertiary' : 'textPrimary'} />
        </Pressable>
      </View>
    </View>
  );
}
