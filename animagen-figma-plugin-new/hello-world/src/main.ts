import { showUI, on, once, emit } from '@create-figma-plugin/utilities'
import { AuthController } from './controllers/AuthController'
import { AnimaGenAPIService } from './services/AnimaGenAPIService'

// Global instances
let authController: AuthController
let apiService: AnimaGenAPIService

export default function () {
  console.log('🚀 AnimaGen Plugin Starting...')

  // Initialize services
  authController = new AuthController()
  apiService = new AnimaGenAPIService()

  // Show UI
  showUI({
    width: 400,
    height: 600,
    title: 'AnimaGen Exporter'
  })

  // Set up message handlers
  setupMessageHandlers()

  // Send initial data immediately (don't wait for auth)
  sendInitialData()
}

function setupMessageHandlers() {
  // Handle UI ready
  once('ui-ready', () => {
    console.log('🎨 UI is ready')
    // Initialize plugin in background, don't block UI
    initializePlugin().catch(error => {
      console.error('❌ Background initialization failed:', error)
    })
  })

  // Handle authentication
  on('authenticate', (data: { apiKey: string }) => {
    handleAuthentication(data.apiKey)
  })

  // Handle logout
  on('logout', () => {
    handleLogout()
  })

  // Handle auth validation
  on('validate-auth', () => {
    handleAuthValidation()
  })

  // Handle frame detection
  on('detect-frames', () => {
    detectAndSendFrames()
  })

  // Handle frame export
  on('export-frames', (data: { frameIds: string[], settings: any }) => {
    handleFrameExport(data.frameIds, data.settings)
  })

  // Handle external URL opening
  on('open-external-url', (data: { url: string }) => {
    handleOpenExternalUrl(data.url)
  })
}

function sendInitialData() {
  console.log('📤 Sending initial data to UI...')

  // Detect frames immediately
  detectAndSendFrames()

  // Send initial auth state (not authenticated, not loading)
  emit('auth-state-changed', {
    authenticated: false,
    loading: false,
    requiresSetup: true
  })
}

async function initializePlugin() {
  try {
    console.log('🔧 Starting background plugin initialization...')

    // Try to initialize authentication in background
    console.log('🔐 Initializing authentication...')
    await authController.initialize()
    console.log('✅ Background authentication initialized')

  } catch (error) {
    console.error('❌ Background initialization failed:', error)
    // Don't emit error here, let user try to authenticate manually
  }
}

function detectAndSendFrames() {
  console.log('🔍 Detecting frames and selection...')

  // Get all frames on the current page
  const allFrames = figma.currentPage.findAll(node =>
    node.type === 'FRAME' &&
    node.width > 0 &&
    node.height > 0
  ) as FrameNode[]

  // Get currently selected frames
  const selectedFrames = figma.currentPage.selection.filter(node =>
    node.type === 'FRAME' &&
    node.width > 0 &&
    node.height > 0
  ) as FrameNode[]

  console.log(`📋 Found ${allFrames.length} total frames on page`)
  console.log(`🎯 Found ${selectedFrames.length} selected frames`)

  if (selectedFrames.length > 0) {
    console.log('📋 Selected frame names:', selectedFrames.map(f => f.name))
  }

  // Map all frames for the UI
  const detectedFrames = allFrames.map((frame, index) => {
    const complexity = estimateComplexity(frame)

    return {
      id: frame.id,
      name: frame.name,
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      x: Math.round(frame.x),
      y: Math.round(frame.y),
      order: index,
      complexity,
      isValidForExport: true,
      estimatedSize: estimateFileSize(frame.width, frame.height, complexity),
      selected: false,
      visible: frame.visible,
      locked: frame.locked,
      aspectRatio: frame.width / frame.height
    }
  })

  // Get IDs of selected frames for pre-selection in UI
  const figmaSelection = selectedFrames.map(frame => frame.id)

  console.log(`✅ Sending ${detectedFrames.length} frames with ${figmaSelection.length} pre-selected`)

  emit('frames-detected', {
    frames: detectedFrames,
    figmaSelection: figmaSelection
  })
}

function estimateComplexity(frame: FrameNode): 'low' | 'medium' | 'high' {
  const childCount = frame.children.length
  const hasEffects = frame.effects && frame.effects.length > 0
  const hasComplexFills = frame.fills && (frame.fills as readonly Paint[]).some(fill => fill.type !== 'SOLID')

  let score = 0
  if (childCount > 10) score += 1
  if (childCount > 25) score += 1
  if (hasEffects) score += 1
  if (hasComplexFills) score += 1

  if (score <= 1) return 'low'
  if (score <= 2) return 'medium'
  return 'high'
}

function estimateFileSize(width: number, height: number, complexity: string): string {
  const pixels = width * height
  let multiplier = 3 // Base RGB

  switch (complexity) {
    case 'medium': multiplier = 4; break
    case 'high': multiplier = 6; break
  }

  const bytes = pixels * multiplier

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`
  } else {
    return `${Math.round(bytes / (1024 * 1024))}MB`
  }
}

async function handleAuthentication(apiKey: string) {
  try {
    console.log('🔐 Handling authentication with real API...')
    await authController.authenticateWithAPIKey(apiKey)
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    // Error is already handled by AuthController and sent to UI
  }
}

async function handleLogout() {
  try {
    console.log('👋 Handling logout...')
    await authController.logout()
  } catch (error) {
    console.error('❌ Logout failed:', error)
  }
}

async function handleAuthValidation() {
  try {
    console.log('🔍 Validating current authentication...')
    const currentState = authController.getCurrentAuthState()
    emit('auth-state-changed', currentState)
  } catch (error) {
    console.error('❌ Auth validation failed:', error)
  }
}

function handleOpenExternalUrl(url: string) {
  try {
    console.log('🔗 Opening external URL:', url)
    figma.openExternal(url)
  } catch (error) {
    console.error('❌ Failed to open external URL:', error)
  }
}

async function handleFrameExport(frameIds: string[], settings: any) {
  console.log('📤 Starting frame export and upload to AnimaGen...')

  // Check authentication first
  const authState = authController.getCurrentAuthState()
  if (!authState.authenticated) {
    figma.ui.postMessage({
      type: 'export-error',
      data: {
        error: 'Authentication required',
        message: 'Please authenticate with your AnimaGen API key first',
        code: 'AUTH_REQUIRED'
      }
    })
    return
  }

  const exportId = `export_${Date.now()}`

  // Send initial progress
  figma.ui.postMessage({
    type: 'export-progress',
    data: {
      stage: 'preparing',
      current: 0,
      total: frameIds.length,
      message: 'Preparing export...',
      exportId: exportId,
      percentage: 0
    }
  })

  const frameResults = []

  // Phase 1: Export frames from Figma
  for (let i = 0; i < frameIds.length; i++) {
    const frameId = frameIds[i]
    const frame = figma.getNodeById(frameId) as FrameNode

    if (!frame || frame.type !== 'FRAME') {
      console.warn(`⚠️ Frame ${frameId} not found or invalid`)
      continue
    }

    // Send progress update
    figma.ui.postMessage({
      type: 'export-progress',
      data: {
        stage: 'exporting',
        current: i + 1,
        total: frameIds.length,
        message: `Exporting "${frame.name}"...`,
        frameName: frame.name,
        exportId: exportId,
        percentage: Math.round(((i + 1) / frameIds.length) * 50) // 50% for export phase
      }
    })

    try {
      // Export frame with optimized settings for smaller file sizes
      const exportSettings = {
        format: settings.format || 'JPG', // Use JPG by default for smaller files
        constraint: {
          type: 'SCALE',
          value: settings.scale || 1 // Use 1x scale by default to reduce file size
        }
      };

      console.log(`📸 Exporting frame "${frame.name}" with settings:`, exportSettings);

      const imageData = await frame.exportAsync(exportSettings)

      frameResults.push({
        success: true,
        frameId,
        frameName: frame.name,
        imageData: imageData,
        metadata: {
          width: frame.width,
          height: frame.height
        },
        order: i,
        exportTime: Date.now(),
        fileSize: imageData.length
      })

      console.log(`✅ Exported frame: ${frame.name}`)

    } catch (error) {
      console.error(`❌ Failed to export frame ${frame.name}:`, error)

      frameResults.push({
        success: false,
        frameId,
        frameName: frame.name,
        error: (error as Error).message,
        order: i,
        exportTime: Date.now()
      })
    }

    // Small delay to prevent overwhelming Figma
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Phase 2: Upload to AnimaGen
  try {
    figma.ui.postMessage({
      type: 'export-progress',
      data: {
        stage: 'uploading',
        current: frameResults.length,
        total: frameIds.length,
        message: 'Uploading to AnimaGen...',
        exportId: exportId,
        percentage: 75
      }
    })

    const uploadResponse = await apiService.uploadFrames(frameResults, settings)

    // Send success completion
    figma.ui.postMessage({
      type: 'export-complete',
      data: {
        success: true,
        exportId: exportId,
        sessionId: uploadResponse.sessionId,
        projectId: uploadResponse.projectId,
        projectUrl: uploadResponse.projectUrl,
        framesExported: frameResults.filter(r => r.success).length,
        framesTotal: frameResults.length,
        failedFrames: frameResults.filter(r => !r.success).map(r => r.frameName),
        uploadResult: uploadResponse,
        exportTime: Date.now(),
        settings: settings
      }
    })

    console.log('🎉 Export and upload completed successfully!')
    console.log('🔗 Project URL:', uploadResponse.projectUrl)

  } catch (error) {
    console.error('❌ Upload to AnimaGen failed:', error)

    figma.ui.postMessage({
      type: 'export-error',
      data: {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Failed to upload to AnimaGen',
        code: 'UPLOAD_ERROR',
        exportId: exportId,
        framesExported: frameResults.filter(r => r.success).length,
        framesTotal: frameResults.length
      }
    })
  }
}
