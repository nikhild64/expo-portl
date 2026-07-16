import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colorClass, typographyClass } from '@/lib/classNames';
import type { ThemeColor, Typography } from '@/theme';

export interface TextProps extends RNTextProps {
  children?: ReactNode;
  variant?: Typography;
  color?: ThemeColor;
  className?: string;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  className,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      className={`${typographyClass[variant]} ${colorClass[color]}${className ? ` ${className}` : ''}`}
    />
  );
}
