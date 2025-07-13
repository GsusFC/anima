import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Text, Button, Dropdown, VerticalSpace } from '@create-figma-plugin/ui'

interface ExportSettingsProps {
  exportFormat: string
  exportScale: string
  exportQuality: string
  onFormatChange: (value: string) => void
  onScaleChange: (value: string) => void
  onQualityChange: (value: string) => void
  isOpen: boolean
  onClose: () => void
}

export function ExportSettings({
  exportFormat,
  exportScale,
  exportQuality,
  onFormatChange,
  onScaleChange,
  onQualityChange,
  isOpen,
  onClose
}: ExportSettingsProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        width: '320px',
        maxWidth: '90vw',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            ⚙️ Export Settings
          </Text>
          <Button
            secondary
            onClick={onClose}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              minHeight: '24px'
            }}
          >
            ✕
          </Button>
        </div>

        {/* Settings */}
        <div style={{ marginBottom: '20px' }}>
          {/* Format */}
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>
              Format
            </Text>
            <Dropdown
              value={exportFormat}
              onValueChange={onFormatChange}
              options={[
                { value: 'PNG', text: 'PNG (Lossless)' },
                { value: 'JPG', text: 'JPG (Smaller files)' }
              ]}
              style={{ width: '100%' }}
            />
          </div>

          {/* Scale */}
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>
              Scale
            </Text>
            <Dropdown
              value={exportScale}
              onValueChange={onScaleChange}
              options={[
                { value: '1', text: '1x (Recommended)' },
                { value: '2', text: '2x (High DPI)' },
                { value: '3', text: '3x (Ultra High DPI)' }
              ]}
              style={{ width: '100%' }}
            />
          </div>

          {/* Quality for JPG */}
          {exportFormat === 'JPG' && (
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px',
                display: 'block'
              }}>
                Quality
              </Text>
              <Dropdown
                value={exportQuality}
                onValueChange={onQualityChange}
                options={[
                  { value: '0.6', text: '60% (Smaller files)' },
                  { value: '0.8', text: '80% (Recommended)' },
                  { value: '0.9', text: '90% (High quality)' },
                  { value: '1.0', text: '100% (Maximum)' }
                ]}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <Text style={{ fontSize: '11px', color: '#166534', lineHeight: '1.4' }}>
            💡 <strong>Tip:</strong> JPG format with 1x scale produces smaller files and faster uploads to AnimaGen.
          </Text>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            secondary
            fullWidth
            onClick={onClose}
            style={{ fontSize: '12px' }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={onClose}
            style={{
              backgroundColor: '#ec4899',
              borderColor: '#ec4899',
              fontSize: '12px'
            }}
          >
            Apply Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
