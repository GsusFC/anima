import { h } from 'preact'
import { Button } from '@create-figma-plugin/ui'

export interface ExportProgress {
  stage: 'thumbnails' | 'uploading' | 'creating' | 'completed' | 'error'
  current: number
  total: number
  message: string
  percentage: number
}

interface ExportButtonProps {
  selectedFrames: string[]
  isAuthenticated: boolean
  isExporting: boolean
  exportProgress: ExportProgress | null
  exportResult: { slideshowUrl?: string } | null
  onExport: () => void
  onOpenSlideshow: (url: string) => void
  onRetry: () => void
}

export function ExportButton({
  selectedFrames,
  isAuthenticated,
  isExporting,
  exportProgress,
  exportResult,
  onExport,
  onOpenSlideshow,
  onRetry
}: ExportButtonProps) {
  
  // Export completed successfully - show link button
  if (exportResult && exportResult.slideshowUrl) {
    return (
      <Button
        fullWidth
        onClick={() => onOpenSlideshow(exportResult.slideshowUrl!)}
        style={{
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          minHeight: '40px',
          fontWeight: '600',
          color: 'white'
        }}
      >
        🎬 Open Slideshow in AnimaGen
      </Button>
    )
  }

  // Export in progress - show progress bar
  if (isExporting && exportProgress) {
    return (
      <div style={{
        width: '100%',
        minHeight: '40px',
        backgroundColor: '#f3f4f6',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          marginBottom: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${exportProgress.percentage}%`,
            height: '100%',
            backgroundColor: '#ec4899',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {/* Progress Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            {exportProgress.message}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#6b7280'
          }}>
            {exportProgress.current}/{exportProgress.total}
          </span>
        </div>
      </div>
    )
  }

  // Export failed - show error state with retry
  if (exportProgress?.stage === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          width: '100%',
          minHeight: '40px',
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '8px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#dc2626'
          }}>
            ❌ Export failed: {exportProgress.message}
          </span>
        </div>
        <Button
          fullWidth
          onClick={onRetry}
          style={{
            backgroundColor: '#ec4899',
            borderColor: '#ec4899',
            minHeight: '36px',
            fontWeight: '600'
          }}
        >
          🔄 Retry Export
        </Button>
      </div>
    )
  }

  // Default export button
  const canExport = selectedFrames.length > 0 && isAuthenticated
  const buttonText = !isAuthenticated
    ? '🔐 Authentication Required to Export'
    : `🚀 Export ${selectedFrames.length} Frame${selectedFrames.length !== 1 ? 's' : ''} to AnimaGen`

  // Debug logging
  console.log('🔧 ExportButton props:', {
    selectedFrames: selectedFrames.length,
    isAuthenticated,
    canExport,
    isExporting,
    exportProgress,
    exportResult
  })

  const handleClick = () => {
    console.log('🔧 ExportButton clicked! canExport:', canExport)
    if (canExport) {
      console.log('🔧 Calling onExport...')
      onExport()
    } else {
      console.log('🔧 Export disabled - canExport is false')
    }
  }

  return (
    <Button
      fullWidth
      onClick={handleClick}
      disabled={!canExport}
      style={{
        backgroundColor: canExport ? '#ec4899' : '#d1d5db',
        borderColor: canExport ? '#ec4899' : '#d1d5db',
        minHeight: '40px',
        fontWeight: '600'
      }}
    >
      {buttonText}
    </Button>
  )
}
