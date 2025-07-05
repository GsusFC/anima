import React from 'react';
import { colors, typography, spacing, borderRadius, components } from './tokens';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'base' | 'lg';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  error = false,
  size = 'base'
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const selectStyles = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    height: components.input.height,
    padding: `0 ${spacing.sm}`,
    backgroundColor: colors.bg.primary,
    border: `1px solid ${error ? colors.border.error : isFocused ? colors.border.focus : colors.border.primary}`,
    borderRadius: borderRadius.base,
    color: colors.text.primary,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23B3B3B3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 8px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: spacing.xl
  };

  return React.createElement('select', {
    value,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!disabled) {
        onChange(e.target.value);
      }
    },
    disabled,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    style: selectStyles
  }, options.map(option =>
    React.createElement('option', {
      key: option.value,
      value: option.value,
      style: {
        backgroundColor: colors.bg.primary,
        color: colors.text.primary
      }
    }, option.label)
  ));
};
