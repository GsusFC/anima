import React from 'react';
import { Button } from '../design-system/Button';
import { colors, spacing, typography } from '../design-system/tokens';

interface ErrorDisplayProps {
  errorMessage: string;
  canDownload?: boolean;
  hasLogUrl?: boolean;
  onDownloadVideo?: () => void;
  onDownloadLog?: () => void;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorMessage,
  canDownload,
  hasLogUrl,
  onDownloadVideo,
  onDownloadLog,
  onRetry
}) => {
  return (
    <div
      style={{
        padding: spacing.xl,
        backgroundColor: colors.bg.primary,
        color: colors.status.error,
        fontFamily: typography.fontFamily,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium
        }}
      >
        Error: {errorMessage}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {canDownload && onDownloadVideo && (
          <Button
            variant="success"
            size="base"
            onClick={onDownloadVideo}
          >
            ⬇️ Download Last Video
          </Button>
        )}

        {hasLogUrl && onDownloadLog && (
          <Button
            variant="secondary"
            size="base"
            onClick={onDownloadLog}
          >
            📋 Download Log
          </Button>
        )}

        <Button
          variant="primary"
          size="base"
          onClick={onRetry}
        >
          🔄 Try Again
        </Button>
      </div>
    </div>
  );
};
