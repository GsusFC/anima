import { h } from 'preact'
import { Text, Button, Checkbox, VerticalSpace } from '@create-figma-plugin/ui'

interface Frame {
  id: string
  name: string
  width: number
  height: number
  complexity: 'low' | 'medium' | 'high'
  estimatedSize: string
  isValidForExport: boolean
}

interface FrameListProps {
  frames: Frame[]
  selectedFrames: string[]
  onFrameSelection: (frameId: string, checked: boolean) => void
  onSelectAll: () => void
  onClearAll: () => void
  figmaSelection?: string[] // Frames seleccionados en Figma
}

export function FrameList({ 
  frames, 
  selectedFrames, 
  onFrameSelection, 
  onSelectAll, 
  onClearAll,
  figmaSelection = []
}: FrameListProps) {
  const validFrames = frames.filter(frame => frame.isValidForExport)
  const selectedCount = selectedFrames.length
  const totalCount = validFrames.length

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return '🟢'
      case 'medium': return '🟡'
      case 'high': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header con información */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <Text style={{ fontSize: '14px', fontWeight: '600' }}>
            {totalCount > 0 ? '🎯 Selected Frames' : '📋 Select Frames'}
          </Text>
          {totalCount > 0 && (
            <Text style={{
              fontSize: '12px',
              color: selectedCount > 0 ? '#ec4899' : '#6b7280',
              fontWeight: selectedCount > 0 ? '600' : '400'
            }}>
              {selectedCount} of {totalCount} selected
            </Text>
          )}
        </div>

        {/* Mostrar si hay selección de Figma */}
        {figmaSelection.length > 0 && totalCount > 0 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '12px'
          }}>
            <Text style={{ fontSize: '11px', color: '#166534' }}>
              ✅ {figmaSelection.length} frames imported from your Figma selection
            </Text>
          </div>
        )}

        {/* Controles de selección */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            secondary
            onClick={onSelectAll}
            disabled={selectedCount === totalCount}
            style={{ fontSize: '11px', padding: '4px 8px', minHeight: '24px' }}
          >
            Select All
          </Button>
          <Button
            secondary
            onClick={onClearAll}
            disabled={selectedCount === 0}
            style={{ fontSize: '11px', padding: '4px 8px', minHeight: '24px' }}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Lista de frames */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: '#ffffff'
      }}>
        {validFrames.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <Text style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              No frames selected
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.4' }}>
              Please select frames in Figma first,<br />
              then return to this plugin to export them.
            </Text>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <Text style={{ fontSize: '11px', color: '#1e40af' }}>
                💡 <strong>How to select frames:</strong><br />
                1. Close this plugin<br />
                2. Select frames in Figma<br />
                3. Reopen the plugin
              </Text>
            </div>
          </div>
        ) : (
          validFrames.map((frame, index) => {
            const isSelected = selectedFrames.includes(frame.id)
            const wasSelectedInFigma = figmaSelection.includes(frame.id)
            
            return (
              <div
                key={frame.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: index < validFrames.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: isSelected ? '#fef7ff' : 'transparent',
                  borderLeft: isSelected ? '3px solid #ec4899' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onFrameSelection(frame.id, !isSelected)}
              >
                {/* Checkbox */}
                <div style={{ marginRight: '12px' }}>
                  <Checkbox
                    value={isSelected}
                    onValueChange={(checked) => onFrameSelection(frame.id, checked)}
                  >
                    <span></span>
                  </Checkbox>
                </div>

                {/* Frame info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <Text style={{ 
                      fontSize: '12px', 
                      fontWeight: '500',
                      color: isSelected ? '#ec4899' : '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {frame.name}
                    </Text>
                    {wasSelectedInFigma && (
                      <span style={{ 
                        fontSize: '10px', 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af',
                        padding: '1px 4px',
                        borderRadius: '2px'
                      }}>
                        Figma
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text style={{ fontSize: '10px', color: '#6b7280' }}>
                      {frame.width}×{frame.height}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '8px' }}>
                        {getComplexityIcon(frame.complexity)}
                      </span>
                      <Text style={{ 
                        fontSize: '10px', 
                        color: getComplexityColor(frame.complexity),
                        fontWeight: '500'
                      }}>
                        {frame.estimatedSize}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer con información */}
      {selectedCount > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '4px'
        }}>
          <Text style={{ fontSize: '11px', color: '#166534' }}>
            ✅ Ready to export {selectedCount} frame{selectedCount !== 1 ? 's' : ''}
          </Text>
        </div>
      )}
    </div>
  )
}
