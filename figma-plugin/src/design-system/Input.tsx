import React from 'react';
import { colors, typography, spacing, borderRadius, components } from './tokens';

interface InputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  disabled?: boolean;
  error?: boolean;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
  suffix,
  min,
  max,
  step
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyles = {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center'
  };

  const inputStyles = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    height: components.input.height,
    padding: components.input.padding,
    backgroundColor: colors.bg.primary,
    border: `1px solid ${error ? colors.border.error : isFocused ? colors.border.focus : colors.border.primary}`,
    borderRadius: borderRadius.base,
    color: colors.text.primary,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    '::placeholder': {
      color: colors.text.tertiary
    }
  };

  const suffixStyles = {
    position: 'absolute' as const,
    right: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    pointerEvents: 'none' as const
  };

  return React.createElement('div', { style: containerStyles }, [
    React.createElement('input', {
      key: 'input',
      type,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(newValue);
      },
      placeholder,
      disabled,
      min,
      max,
      step,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      style: inputStyles
    }),
    suffix && React.createElement('span', {
      key: 'suffix',
      style: suffixStyles
    }, suffix)
  ]);
};
