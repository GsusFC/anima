import { render, Container, Text, Button, Textbox, Dropdown, DropdownOption, Checkbox, LoadingIndicator, VerticalSpace, Divider } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

// Componentes UI mejorados
import { Header, APIKeyPage, FrameList, FrameGrid, ExportProgress, SuccessPage, ExportSettings } from './components'
import { ExportButton } from './components/ExportButton'

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

interface ExportProgressState {
  stage: 'thumbnails' | 'uploading' | 'creating' | 'completed' | 'error'
  current: number
  total: number
  message: string
  percentage: number
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
  const [exportProgressState, setExportProgressState] = useState<ExportProgressState | null>(null)
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

    // Listen for export progress via native messaging
    window.addEventListener('message', (event) => {
      const msg = event.data.pluginMessage
      if (!msg) return

      if (msg.type === 'export-progress') {
        console.log('📊 Export progress:', msg)
        setExportProgress(msg.data || msg)

        // Convert to detailed progress state
        const data = msg.data || msg
        const progressState: ExportProgressState = {
          stage: data.stage === 'generating' ? 'thumbnails' :
                 data.stage === 'uploading' ? 'uploading' :
                 data.stage === 'processing' ? 'creating' : 'uploading',
          current: data.current,
          total: data.total,
          message: data.stage === 'generating' ? `Generating thumbnails... (${data.current}/${data.total})` :
                   data.stage === 'uploading' ? `Uploading frames to AnimaGen... (${data.current}/${data.total})` :
                   data.stage === 'processing' ? 'Creating slideshow...' :
                   `Processing... (${data.current}/${data.total})`,
          percentage: Math.round((data.current / data.total) * 100)
        }
        setExportProgressState(progressState)
      } else if (msg.type === 'export-complete') {
        console.log('✅ Export complete:', msg)
        setIsExporting(false)
        setExportProgress(null)
        setExportProgressState(null)

        // Add slideshow URL to result
        const data = msg.data || msg
        const resultWithUrl = {
          ...data,
          slideshowUrl: data.projectUrl || `https://anima-production-3dad.up.railway.app/slideshow?sessionId=${data.sessionId}`
        }
        setExportResult(resultWithUrl)
      } else if (msg.type === 'export-error') {
        console.error('❌ Export error:', msg)
        setIsExporting(false)
        setExportProgress(null)

        // Set error state in progress
        const data = msg.data || msg
        setExportProgressState({
          stage: 'error',
          current: 0,
          total: 0,
          message: data.error || data.message || 'Export failed',
          percentage: 0
        })
      }
    })

    on('thumbnail-response', (data: any) => {
      console.log('🖼️ Thumbnail response received:', data)
      // The FrameGrid component will handle this via window message events
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
    parent.postMessage({
      pluginMessage: {
        type: 'detect-frames'
      }
    }, '*')
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
    console.log('🚀 Export button clicked!')
    console.log('📋 Selected frames:', selectedFrames)
    console.log('🔐 Auth state:', authState)

    if (selectedFrames.length === 0) {
      console.log('⚠️ No frames selected, aborting export')
      return
    }

    if (!authState.authenticated) {
      console.log('⚠️ Not authenticated, aborting export')
      return
    }

    console.log('✅ Starting export process...')
    setIsExporting(true)
    setExportResult(null)

    const settings = {
      format: exportFormat,
      scale: parseInt(exportScale),
      quality: parseFloat(exportQuality) // Add quality setting for JPG compression
    }

    console.log('📤 Sending export-frames message with settings:', settings)

    // Use native Figma messaging system instead of emit/on
    parent.postMessage({
      pluginMessage: {
        type: 'export-frames',
        frameIds: selectedFrames,
        settings: settings
      }
    }, '*')
  }

  const handleLogout = () => {
    emit('logout')
    setApiKey('')
    setExportResult(null)
  }

  const openExternalUrl = (url: string) => {
    console.log(`🔗 Emitting open-external-url event for: ${url}`)
    emit('open-external-url', { url })
  }

  const handleOpenProject = (url: string) => {
    console.log(`🌐 Opening AnimaGen project: ${url}`)

    // Ensure URL is properly formatted
    const finalUrl = url.startsWith('http') ? url : `https://${url}`

    try {
      openExternalUrl(finalUrl)
      console.log(`✅ Successfully opened: ${finalUrl}`)
    } catch (error) {
      console.error('❌ Failed to open external URL:', error)
      // Fallback: try to open in new window
      try {
        window.open(finalUrl, '_blank')
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
      }
    }
  }

  const handleStartNew = () => {
    setExportResult(null)
    setSelectedFrames([])
    setExportProgress(null)
    setExportProgressState(null)
    handleRefreshFrames()
  }

  const handleOpenSlideshow = (url: string) => {
    console.log('🎬 Opening slideshow:', url)
    parent.postMessage({
      pluginMessage: {
        type: 'open-external-url',
        url: url
      }
    }, '*')
  }

  const handleRetryExport = () => {
    setExportProgressState(null)
    setExportResult(null)
    handleExport()
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
    // Si hay frames detectados, mostrar la interfaz principal con autenticación requerida para export
    if (frames.length > 0) {
      // Continuar al flujo principal pero deshabilitar export
    } else {
      // Si no hay frames, mostrar página de autenticación
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
      {/* Authentication Required Banner */}
      {!authState.authenticated && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          textAlign: 'center'
        }}>
          🔐 <strong>Authentication required to export frames</strong>
          <button
            onClick={() => {/* Show auth modal or redirect */}}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Authenticate
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        user={authState.user}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
      />

      {/* Frame Grid */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FrameGrid
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
        <ExportButton
          selectedFrames={selectedFrames}
          isAuthenticated={authState.authenticated}
          isExporting={isExporting}
          exportProgress={exportProgressState}
          exportResult={exportResult}
          onExport={handleExport}
          onOpenSlideshow={handleOpenSlideshow}
          onRetry={handleRetryExport}
        />

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
