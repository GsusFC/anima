import React from 'react';
import { colors, typography, spacing, borderRadius } from './tokens';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

const colorMap = {
  primary: colors.accent.primary,
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  color = 'primary'
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs
          }}
        >
          {label && (
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary
              }}
            >
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}
            >
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: colors.bg.primary,
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          border: `1px solid ${colors.border.primary}`
        }}
      >
        <div
          style={{
            width: `${clampedValue}%`,
            height: '100%',
            backgroundColor: colorMap[color],
            transition: 'width 0.3s ease',
            borderRadius: borderRadius.sm
          }}
        />
      </div>
    </div>
  );
};
