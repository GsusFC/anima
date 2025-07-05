import React from 'react';
import { colors, typography, spacing, borderRadius, components } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'ghost';
export type ButtonSize = 'sm' | 'base' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

const getButtonStyles = (variant: ButtonVariant, size: ButtonSize, disabled: boolean, fullWidth: boolean) => {
  const baseStyles = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    border: 'none',
    borderRadius: borderRadius.base,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    outline: 'none',
    userSelect: 'none' as const,
    height: components.button.height[size],
    padding: components.button.padding[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? colors.interactive.primary : colors.interactive.primary,
      color: colors.text.primary,
      ':hover': !disabled && {
        backgroundColor: colors.interactive.primaryHover
      },
      ':active': !disabled && {
        backgroundColor: colors.interactive.primaryPressed
      }
    },
    secondary: {
      backgroundColor: colors.interactive.secondary,
      color: colors.text.primary,
      ':hover': !disabled && {
        backgroundColor: colors.interactive.secondaryHover
      }
    },
    success: {
      backgroundColor: colors.status.success,
      color: colors.text.primary,
      ':hover': !disabled && {
        backgroundColor: colors.status.successHover
      }
    },
    error: {
      backgroundColor: colors.status.error,
      color: colors.text.primary,
      ':hover': !disabled && {
        backgroundColor: colors.status.errorHover
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      border: `1px solid ${colors.border.primary}`,
      ':hover': !disabled && {
        backgroundColor: colors.bg.secondary,
        color: colors.text.primary
      }
    }
  };

  return {
    ...baseStyles,
    ...variantStyles[variant]
  };
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'base',
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  style: customStyle = {}
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const styles = getButtonStyles(variant, size, disabled, fullWidth);
  
  let finalStyles = { ...styles, ...customStyle };
  if (isHovered && !disabled && (styles as any)[':hover']) {
    finalStyles = { ...finalStyles, ...(styles as any)[':hover'] };
  }
  if (isPressed && !disabled && (styles as any)[':active']) {
    finalStyles = { ...finalStyles, ...(styles as any)[':active'] };
  }

  return React.createElement('button', {
    type,
    disabled,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    style: finalStyles
  }, children);
};
