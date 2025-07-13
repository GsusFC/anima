import { render, Container, Text, Button, Textbox, Dropdown, DropdownOption, Checkbox, LoadingIndicator, VerticalSpace, Divider } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

interface Frame {
  id: string
  name: string
  width: number
  height: number
  complexity: 'low' | 'medium' | 'high'
  estimatedSize: string
  isValidForExport: boolean
}

interface AuthState {
  authenticated: boolean
  loading: boolean
  user?: {
    name: string
    email: string
    plan: string
  }
  error?: string
  requiresSetup?: boolean
}

interface ExportProgress {
  stage: string
  current: number
  total: number
  message: string
  percentage: number
}

interface ExportResult {
  success: boolean
  exportId: string
  sessionId?: string
  projectId?: string
  projectUrl?: string
  framesExported: number
  framesTotal: number
  failedFrames?: string[]
  uploadResult?: {
    sessionId: string
    projectId: string
    projectUrl: string
    framesImported: number
    message: string
  }
  error?: string
  message?: string
}

function Plugin() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    loading: true
  })
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [apiKey, setApiKey] = useState('')
  const [exportFormat, setExportFormat] = useState('JPG') // Changed to JPG for smaller file sizes
  const [exportScale, setExportScale] = useState('1') // Changed to 1x scale to reduce file size
  const [exportQuality, setExportQuality] = useState('0.8') // JPG quality (0.1-1.0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  useEffect(() => {
    // Set up message listeners
    on('auth-state-changed', (data: AuthState) => {
      console.log('🔐 Auth state changed in UI:', data)
      console.log('🔐 Setting auth state to:', data)
      setAuthState(data)
      console.log('🔐 Auth state set successfully')
    })

    on('frames-detected', (data: { frames: Frame[] }) => {
      console.log('🖼️ Frames detected:', data)
      setFrames(data.frames)
    })

    on('export-progress', (data: ExportProgress) => {
      console.log('📊 Export progress:', data)
      setExportProgress(data)
    })

    on('export-complete', (data: ExportResult) => {
      console.log('✅ Export complete:', data)
      setIsExporting(false)
      setExportProgress(null)
      setExportResult(data)
    })

    on('export-error', (data: ExportResult) => {
      console.error('❌ Export error:', data)
      setIsExporting(false)
      setExportProgress(null)
      setExportResult(data)
    })

    // Send UI ready message
    emit('ui-ready')
  }, [])

  const handleAuthenticate = () => {
    if (!apiKey.trim()) {
      console.log('⚠️ No API key provided')
      return
    }
    console.log('📤 Sending authenticate message with key:', apiKey)
    emit('authenticate', { apiKey })
  }

  const handleRefreshFrames = () => {
    emit('detect-frames')
  }

  const handleFrameSelection = (frameId: string, checked: boolean) => {
    if (checked) {
      setSelectedFrames([...selectedFrames, frameId])
    } else {
      setSelectedFrames(selectedFrames.filter(id => id !== frameId))
    }
  }

  const handleExport = () => {
    if (selectedFrames.length === 0) {
      return
    }

    setIsExporting(true)
    setExportResult(null)

    const settings = {
      format: exportFormat,
      scale: parseInt(exportScale),
      quality: parseFloat(exportQuality) // Add quality setting for JPG compression
    }

    emit('export-frames', { frameIds: selectedFrames, settings })
  }

  const handleLogout = () => {
    emit('logout')
    setApiKey('')
    setExportResult(null)
  }

  const openExternalUrl = (url: string) => {
    emit('open-external-url', { url })
  }

  if (authState.loading) {
    return (
      <Container space="medium">
        <VerticalSpace space="large" />
        <LoadingIndicator />
        <VerticalSpace space="medium" />
        <Text align="center">Loading AnimaGen Exporter...</Text>
        <VerticalSpace space="large" />
      </Container>
    )
  }

  if (!authState.authenticated) {
    return (
      <Container space="medium">
        <VerticalSpace space="medium" />
        <Text><strong>AnimaGen Exporter</strong></Text>
        <Text>Export Figma frames to AnimaGen slideshows</Text>
        <VerticalSpace space="medium" />
        
        <Divider />
        <VerticalSpace space="medium" />
        
        <Text><strong>Authentication</strong></Text>
        <VerticalSpace space="small" />
        
        {authState.error && (
          <div>
            <Text style={{ color: 'red' }}>{authState.error}</Text>
            <VerticalSpace space="small" />
          </div>
        )}
        
        <Textbox
          placeholder="ag_figma_..."
          value={apiKey}
          onValueInput={setApiKey}
          password
        />
        <VerticalSpace space="small" />
        
        <Button
          fullWidth
          onClick={handleAuthenticate}
          disabled={!apiKey.trim()}
        >
          Connect to AnimaGen
        </Button>
        <VerticalSpace space="medium" />
      </Container>
    )
  }

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <Text><strong>AnimaGen Exporter</strong></Text>
      <Text>Export Figma frames to AnimaGen slideshows</Text>
      <VerticalSpace space="medium" />
      
      {/* User Info */}
      {authState.user && (
        <div>
          <Text style={{ color: 'green' }}>
            ✅ {authState.user.name} ({authState.user.plan})
          </Text>
          <VerticalSpace space="medium" />
        </div>
      )}
      
      <Divider />
      <VerticalSpace space="medium" />
      
      {/* Frame Detection */}
      <Text><strong>Selected Frames ({frames.length})</strong></Text>
      <VerticalSpace space="small" />

      <Button secondary onClick={handleRefreshFrames}>
        Refresh Selection
      </Button>
      <VerticalSpace space="small" />

      {/* Frame List */}
      {frames.length === 0 ? (
        <div>
          <Text style={{ color: '#666' }}>No frames selected</Text>
          <VerticalSpace space="small" />
          <Text style={{ fontSize: '11px', color: '#999' }}>
            Please select frames in Figma to export them
          </Text>
        </div>
      ) : (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {frames.map(frame => (
            <div key={frame.id} style={{ marginBottom: '8px' }}>
              <Checkbox
                value={selectedFrames.includes(frame.id)}
                onValueChange={(checked) => handleFrameSelection(frame.id, checked)}
              >
                <Text>{frame.name}</Text>
                <br />
                <Text style={{ fontSize: '10px', color: '#666' }}>
                  {frame.width}×{frame.height} • {frame.estimatedSize} • {frame.complexity}
                </Text>
              </Checkbox>
            </div>
          ))}
        </div>
      )}
      
      <VerticalSpace space="medium" />
      <Divider />
      <VerticalSpace space="medium" />
      
      {/* Export Settings */}
      <Text><strong>Export Settings</strong></Text>
      <VerticalSpace space="small" />
      
      <Text>Format</Text>
      <Dropdown
        value={exportFormat}
        onValueChange={setExportFormat}
        options={[
          { value: 'PNG', text: 'PNG' },
          { value: 'JPG', text: 'JPG' }
        ]}
      />
      <VerticalSpace space="small" />
      
      <Text>Scale</Text>
      <Dropdown
        value={exportScale}
        onValueChange={setExportScale}
        options={[
          { value: '1', text: '1x' },
          { value: '2', text: '2x' },
          { value: '3', text: '3x' }
        ]}
      />
      <VerticalSpace space="small" />

      {/* Quality setting for JPG */}
      {exportFormat === 'JPG' && (
        <div>
          <Text>Quality (JPG)</Text>
          <Dropdown
            value={exportQuality}
            onValueChange={setExportQuality}
            options={[
              { value: '0.6', text: '60% (Smaller files)' },
              { value: '0.8', text: '80% (Recommended)' },
              { value: '0.9', text: '90% (High quality)' },
              { value: '1.0', text: '100% (Maximum)' }
            ]}
          />
          <VerticalSpace space="small" />
        </div>
      )}

      <VerticalSpace space="medium" />

      {/* Export Progress */}
      {isExporting && exportProgress && (
        <div>
          <LoadingIndicator />
          <VerticalSpace space="small" />
          <Text>{exportProgress.message}</Text>
          <Text style={{ fontSize: '10px' }}>
            {exportProgress.current}/{exportProgress.total} ({exportProgress.percentage}%)
          </Text>
          <VerticalSpace space="medium" />
        </div>
      )}
      
      {/* Export Result */}
      {exportResult && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: exportResult.success ? '#f0f9ff' : '#fef2f2',
          border: `1px solid ${exportResult.success ? '#bfdbfe' : '#fecaca'}`
        }}>
          <Text style={{
            color: exportResult.success ? '#059669' : '#dc2626',
            fontWeight: 'bold'
          }}>
            {exportResult.success ? '✅ Export Successful!' : '❌ Export Failed'}
          </Text>
          <VerticalSpace space="small" />

          <Text style={{ fontSize: '12px' }}>
            {exportResult.framesExported} of {exportResult.framesTotal} frames processed
          </Text>

          {exportResult.success && exportResult.projectUrl && (
            <div>
              <VerticalSpace space="small" />
              <Button
                fullWidth
                onClick={() => openExternalUrl(exportResult.projectUrl!)}
                style={{ backgroundColor: '#3b82f6' }}
              >
                🎬 Open Slideshow
              </Button>
              <VerticalSpace space="small" />

              {exportResult.uploadResult && (
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  <Text>Session ID: {exportResult.uploadResult.sessionId}</Text>
                  <br />
                  <Text>Project ID: {exportResult.uploadResult.projectId}</Text>
                  {exportResult.uploadResult.message && (
                    <div>
                      <br />
                      <Text>{exportResult.uploadResult.message}</Text>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!exportResult.success && exportResult.error && (
            <div>
              <VerticalSpace space="small" />
              <Text style={{ fontSize: '11px', color: '#dc2626' }}>
                Error: {exportResult.error}
              </Text>
            </div>
          )}

          {exportResult.failedFrames && exportResult.failedFrames.length > 0 && (
            <div>
              <VerticalSpace space="small" />
              <Text style={{ fontSize: '11px', color: '#f59e0b' }}>
                Failed frames: {exportResult.failedFrames.join(', ')}
              </Text>
            </div>
          )}

          <VerticalSpace space="medium" />
        </div>
      )}
      
      {/* Export Button */}
      <Button
        fullWidth
        onClick={handleExport}
        disabled={isExporting || selectedFrames.length === 0}
      >
        {isExporting ? 'Exporting...' : 'Export Selected Frames'}
      </Button>
      <VerticalSpace space="medium" />
      
      <Divider />
      <VerticalSpace space="small" />
      
      {/* Logout */}
      <Button secondary fullWidth onClick={handleLogout}>
        Disconnect
      </Button>
      <VerticalSpace space="medium" />
    </Container>
  )
}

export default render(Plugin)
