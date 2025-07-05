import React from 'react';
import { Button } from '../design-system/Button';
import { TabGroup } from '../design-system/TabGroup';
import { ProgressBar } from '../design-system/ProgressBar';
import { colors, spacing } from '../design-system/tokens';
import { ExportSettings } from '../types/slideshow.types';

interface ExportJob {
  id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
}

interface ExportSectionProps {
  isExporting: boolean;
  currentJob: ExportJob | null;
  socketConnected: boolean;
  socketPercent: number;
  canExport: boolean;
  canDownload: boolean;
  exportSettings: ExportSettings;
  onExport: () => void;
  onDownload: () => void;
  onCancel: () => void;
  onFormatChange: (format: string) => void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  isExporting,
  currentJob,
  socketConnected,
  socketPercent,
  canExport,
  canDownload,
  exportSettings,
  onExport,
  onDownload,
  onCancel,
  onFormatChange
}) => {
  const formatTabs = [
    { value: 'mp4', label: 'MP4' },
    { value: 'gif', label: 'GIF' },
    { value: 'webm', label: 'WebM' }
  ];

  const getStatusLabel = () => {
    if (currentJob?.status === 'pending') return 'Queued...';
    if (currentJob?.status === 'processing') return 'Processing...';
    return 'Exporting...';
  };

  const getProgress = () => {
    return socketConnected ? socketPercent : (currentJob?.progress || 0);
  };

  // Integrated button state logic
  const getMainButtonProps = () => {
    if (!canExport && !isExporting && !canDownload) {
      return {
        variant: 'secondary' as const,
        disabled: true,
        text: 'No frames to export',
        onClick: () => {}
      };
    }
    
    if (isExporting) {
      return {
        variant: 'secondary' as const,
        disabled: true,
        text: getStatusLabel(),
        onClick: () => {}
      };
    }
    
    if (canDownload) {
      return {
        variant: 'success' as const,
        disabled: false,
        text: '⬇️ Download Video',
        onClick: onDownload
      };
    }
    
    return {
      variant: 'primary' as const,
      disabled: false,
      text: '🚀 Export Slideshow',
      onClick: onExport
    };
  };

  const mainButtonProps = getMainButtonProps();

  return (
    <div
      style={{
        padding: spacing.lg,
        borderTop: `1px solid ${colors.border.primary}`,
        backgroundColor: colors.bg.secondary
      }}
    >
      {/* Export progress UI */}
      {isExporting ? (
        <div style={{ marginBottom: spacing.md }}>
          <ProgressBar
            value={getProgress()}
            label={getStatusLabel()}
            color="primary"
          />
          <Button
            variant="error"
            size="sm"
            fullWidth
            onClick={onCancel}
            style={{ marginTop: spacing.sm }}
          >
            Cancel Export
          </Button>
        </div>
      ) : canDownload ? (
        /* Dual buttons when download ready */
        <Button
          variant="primary"
          size="lg"
          disabled={!canExport}
          onClick={onExport}
          style={{ width: '100%', marginBottom: spacing.md }}
        >
          🚀 Export Again
        </Button>
      ) : (
        /* Single main button */
        <Button
          variant={mainButtonProps.variant}
          size="lg"
          fullWidth
          disabled={mainButtonProps.disabled}
          onClick={mainButtonProps.onClick}
          style={{ marginBottom: spacing.md }}
        >
          {mainButtonProps.text}
        </Button>
      )}

      {/* Format selector */}
      {!isExporting && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <TabGroup
            tabs={formatTabs}
            value={exportSettings.format}
            onChange={onFormatChange}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
