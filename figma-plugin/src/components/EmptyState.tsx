import React from 'react';
import { Button } from '../design-system/Button';
import { colors, spacing, typography } from '../design-system/tokens';

interface EmptyStateProps {
  onRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh }) => {
  return (
    <div
      style={{
        textAlign: 'center',
        color: colors.text.secondary,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.lg,
        justifyContent: 'center',
        minHeight: '200px'
      }}
    >
      <div style={{
        fontSize: '32px',
        marginBottom: spacing.sm
      }}>
        🖼️
      </div>
      
      <p style={{
        margin: 0,
        fontSize: typography.fontSize.base,
        color: colors.text.secondary
      }}>
        Select frames in Figma and click "Refresh" to load images
      </p>
      
      <Button
        variant="primary"
        size="base"
        onClick={onRefresh}
      >
        Refresh Selection
      </Button>
    </div>
  );
};
