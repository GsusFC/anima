import React from 'react';
import { Button } from '../design-system/Button';
import { colors, spacing, typography } from '../design-system/tokens';

interface HeaderProps {
  frameCount: number;
  onSetAPI: () => void;
  onClose: () => void;
  onOpenLogs?: () => void;
  onOpenSettings?: () => void;
  debugMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ frameCount, onSetAPI, onClose, onOpenLogs, onOpenSettings, debugMode }) => {
  return (
    <div
      style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border.primary}`,
        backgroundColor: colors.bg.secondary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <h3 style={{ 
        margin: 0, 
        fontSize: typography.fontSize.lg,
        color: colors.text.primary
      }}>
        🎬 Slideshow ({frameCount} frames)
      </h3>
      
      <div style={{ display: 'flex', gap: spacing.sm }}>
        {debugMode && onOpenLogs && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenLogs}
          >
            📋 Logs
          </Button>
        )}
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
          >
            ⚙️ Settings
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSetAPI}
        >
          Set API
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
