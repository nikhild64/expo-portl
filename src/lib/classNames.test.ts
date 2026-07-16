import { lightColors } from '@/theme/colors';
import { typography } from '@/theme/tokens';

import { colorClass, colorVariable, typographyClass } from './classNames';

describe('classNames', () => {
  it('maps every typography token to a text-* class', () => {
    for (const key of Object.keys(typography) as Array<keyof typeof typography>) {
      expect(typographyClass[key]).toMatch(/^text-/);
    }
  });

  it('maps every theme color to a text-* class', () => {
    for (const key of Object.keys(lightColors) as Array<keyof typeof lightColors>) {
      expect(colorClass[key]).toMatch(/^text-/);
    }
  });

  it('maps every theme color to a CSS variable name', () => {
    for (const key of Object.keys(lightColors) as Array<keyof typeof lightColors>) {
      expect(colorVariable[key]).toMatch(/^--color-/);
    }
    expect(colorVariable.bg).toBe('--color-bg');
    expect(colorVariable.bgElevated).toBe('--color-bg-elevated');
    expect(colorVariable.textPrimary).toBe('--color-text-primary');
  });

  it('keeps typography and color maps in sync with design tokens', () => {
    expect(Object.keys(typographyClass).sort()).toEqual(Object.keys(typography).sort());
    expect(Object.keys(colorClass).sort()).toEqual(Object.keys(lightColors).sort());
    expect(Object.keys(colorVariable).sort()).toEqual(Object.keys(lightColors).sort());
  });
});
