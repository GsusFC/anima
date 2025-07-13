import { render, Container, Text, Button, Textbox, Dropdown, DropdownOption, Checkbox, LoadingIndicator, VerticalSpace, Divider } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

// Componentes UI mejorados
import { Header, APIKeyPage, FrameList, ExportProgress, SuccessPage, ExportSettings } from './components'

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
  const [figmaSelection, setFigmaSelection] = useState<string[]>([]) // Frames seleccionados en Figma
  const [apiKey, setApiKey] = useState('')
  const [exportFormat, setExportFormat] = useState('JPG') // Changed to JPG for smaller file sizes
  const [exportScale, setExportScale] = useState('1') // Changed to 1x scale to reduce file size
  const [exportQuality, setExportQuality] = useState('0.8') // JPG quality (0.1-1.0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    // Set up message listeners
    on('auth-state-changed', (data: AuthState) => {
      console.log('🔐 Auth state changed in UI:', data)
      console.log('🔐 Setting auth state to:', data)
      setAuthState(data)
      console.log('🔐 Auth state set successfully')
    })

    on('frames-detected', (data: { frames: Frame[], figmaSelection?: string[] }) => {
      console.log('🖼️ Frames detected:', data)
      setFrames(data.frames)

      // Si hay selección de Figma, pre-seleccionar esos frames
      if (data.figmaSelection && data.figmaSelection.length > 0) {
        console.log('🎯 Figma selection detected:', data.figmaSelection)
        setFigmaSelection(data.figmaSelection)
        setSelectedFrames(data.figmaSelection)
      } else {
        setFigmaSelection([])
      }
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

  const handleSelectAll = () => {
    const validFrames = frames.filter(frame => frame.isValidForExport)
    setSelectedFrames(validFrames.map(frame => frame.id))
  }

  const handleClearAll = () => {
    setSelectedFrames([])
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

  const handleOpenProject = (url: string) => {
    openExternalUrl(url)
  }

  const handleStartNew = () => {
    setExportResult(null)
    setSelectedFrames([])
    setExportProgress(null)
    handleRefreshFrames()
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
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
      <APIKeyPage
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onAuthenticate={handleAuthenticate}
        error={authState.error}
        isLoading={authState.loading}
      />
    )
  }

  // Mostrar página de éxito si hay resultado
  if (exportResult) {
    return (
      <SuccessPage
        result={exportResult}
        onOpenProject={handleOpenProject}
        onStartNew={handleStartNew}
      />
    )
  }

  // Mostrar progreso de exportación
  if (isExporting && exportProgress) {
    return (
      <ExportProgress
        stage={exportProgress.stage}
        current={exportProgress.current}
        total={exportProgress.total}
        message={exportProgress.message}
        percentage={exportProgress.percentage}
      />
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        user={authState.user}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
      />

      {/* Frame List */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FrameList
          frames={frames}
          selectedFrames={selectedFrames}
          onFrameSelection={handleFrameSelection}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          figmaSelection={figmaSelection}
        />
      </div>

      {/* Export Button */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '16px',
        backgroundColor: '#ffffff'
      }}>

        {/* Export Button */}
        <Button
          fullWidth
          onClick={handleExport}
          disabled={selectedFrames.length === 0 || isExporting}
          style={{
            backgroundColor: selectedFrames.length > 0 ? '#ec4899' : '#d1d5db',
            borderColor: selectedFrames.length > 0 ? '#ec4899' : '#d1d5db',
            minHeight: '40px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {isExporting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LoadingIndicator />
              <span>Exporting...</span>
            </div>
          ) : (
            `🚀 Export ${selectedFrames.length} Frame${selectedFrames.length !== 1 ? 's' : ''} to AnimaGen`
          )}
        </Button>

        {/* Info text */}
        {selectedFrames.length === 0 && (
          <Text style={{
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            Select frames above to enable export
          </Text>
        )}
      </div>

      {/* Export Settings Modal */}
      <ExportSettings
        exportFormat={exportFormat}
        exportScale={exportScale}
        exportQuality={exportQuality}
        onFormatChange={setExportFormat}
        onScaleChange={setExportScale}
        onQualityChange={setExportQuality}
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </div>
  )
}

export default render(Plugin)
