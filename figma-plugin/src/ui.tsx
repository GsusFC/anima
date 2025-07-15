import { render, Container, Text, Button, Textbox, Dropdown, DropdownOption, Checkbox, LoadingIndicator, VerticalSpace, Divider } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

// Componentes UI mejorados
import { Header, APIKeyPage, FrameGrid, ExportSettings } from './components'
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
  const [useAbsoluteBounds, setUseAbsoluteBounds] = useState(false) // Include effects and strokes
  const [contentsOnly, setContentsOnly] = useState(false) // Export contents only
  // These states are now handled internally by ExportButton
  // const [isExporting, setIsExporting] = useState(false)
  // const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  // const [exportProgressState, setExportProgressState] = useState<ExportProgressState | null>(null)
  // const [exportResult, setExportResult] = useState<ExportResult | null>(null)
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

    // Export progress is now handled internally by ExportButton
    // No need for message listeners here anymore

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

    // Send via both methods to ensure compatibility
    emit('authenticate', { apiKey })

    // Also send via direct postMessage
    parent.postMessage({
      pluginMessage: {
        type: 'authenticate',
        apiKey: apiKey
      }
    }, '*')
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

  const handleExport = async () => {
    console.log('🚀 Export starting...')
    console.log('📋 Selected frames:', selectedFrames)

    if (selectedFrames.length === 0 || !authState.authenticated) {
      console.log('⚠️ Export validation failed')
      return
    }



    const settings = {
      format: exportFormat,
      scale: parseInt(exportScale),
      quality: parseFloat(exportQuality),
      useAbsoluteBounds: useAbsoluteBounds,
      contentsOnly: contentsOnly
    }

    console.log('📤 Sending export-frames message with settings:', settings)

    // Add a small delay to show the clicking feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    // Use native Figma messaging system
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

    // Reset all authentication and selection states
    setApiKey('')
    setSelectedFrames([])

    // Reset auth state to show API key page
    setAuthState({
      authenticated: false,
      loading: false
    })
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

  const handleOpenSlideshow = (url: string) => {
    console.log('🎬 Opening slideshow:', url)
    parent.postMessage({
      pluginMessage: {
        type: 'open-external-url',
        url: url
      }
    }, '*')
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
    // Siempre mostrar página de autenticación cuando no está autenticado
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

  // No more separate pages - everything handled in ExportButton

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          onExport={handleExport}
          onOpenSlideshow={handleOpenSlideshow}
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
        useAbsoluteBounds={useAbsoluteBounds}
        contentsOnly={contentsOnly}
        onFormatChange={setExportFormat}
        onScaleChange={setExportScale}
        onQualityChange={setExportQuality}
        onUseAbsoluteBoundsChange={setUseAbsoluteBounds}
        onContentsOnlyChange={setContentsOnly}
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </div>
  )
}

export default render(Plugin)
