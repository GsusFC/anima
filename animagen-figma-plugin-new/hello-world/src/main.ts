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
    width: 500,
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

  // Handle thumbnail generation via message
  figma.ui.onmessage = (msg) => {
    if (msg.type === 'generate-thumbnail') {
      handleThumbnailGeneration(msg.frameId, msg.messageId)
    }
  }

  // Handle external URL opening
  on('open-external-url', (data: { url: string }) => {
    handleOpenExternalUrl(data.url)
  })
}

async function sendInitialData() {
  console.log('📤 Sending initial data to UI...')

  // Detect frames immediately
  detectAndSendFrames()

  // Initialize auth controller and send real auth state
  try {
    const authState = await authController.initialize()
    console.log('📤 Sending initial auth state:', authState)
    emit('auth-state-changed', authState)
  } catch (error) {
    console.error('❌ Failed to initialize auth:', error)
    emit('auth-state-changed', {
      authenticated: false,
      loading: false,
      requiresSetup: true,
      error: 'Failed to initialize authentication'
    })
  }
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
  console.log('🔍 Detecting selected frames...')

  // Get currently selected frames only
  const selectedFrames = figma.currentPage.selection.filter(node =>
    node.type === 'FRAME' &&
    node.width > 0 &&
    node.height > 0
  ) as FrameNode[]

  console.log(`🎯 Found ${selectedFrames.length} selected frames`)

  if (selectedFrames.length === 0) {
    console.log('⚠️ No frames selected. Please select frames in Figma to export.')
    emit('frames-detected', {
      frames: [],
      figmaSelection: []
    })
    return
  }

  console.log('📋 Selected frame names:', selectedFrames.map(f => f.name))

  // Map only selected frames for the UI
  const detectedFrames = selectedFrames.map((frame, index) => {
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

  // All frames are pre-selected since they were selected in Figma
  const figmaSelection = selectedFrames.map(frame => frame.id)

  console.log(`✅ Sending ${detectedFrames.length} frames (all pre-selected from Figma)`)

  emit('frames-detected', {
    frames: detectedFrames,
    figmaSelection: figmaSelection
  })
}

async function handleThumbnailGeneration(frameId: string, messageId: string) {
  console.log(`🖼️ Generating thumbnail for frame: ${frameId}`)

  try {
    // Find the frame by ID
    const frame = figma.getNodeById(frameId) as FrameNode

    if (!frame || frame.type !== 'FRAME') {
      console.error('❌ Frame not found or invalid type:', frameId)
      figma.ui.postMessage({
        type: 'thumbnail-response',
        messageId,
        success: false,
        error: 'Frame not found'
      })
      return
    }

    console.log(`📸 Exporting frame: ${frame.name} (${frame.width}×${frame.height})`)

    // Generate thumbnail
    const imageData = await frame.exportAsync({
      format: 'PNG',
      constraint: {
        type: 'WIDTH',
        value: 190
      }
    })

    // Convert to base64
    const base64 = figma.base64Encode(imageData)

    console.log(`✅ Thumbnail generated successfully for: ${frame.name}`)

    figma.ui.postMessage({
      type: 'thumbnail-response',
      messageId,
      success: true,
      thumbnail: base64,
      frameId,
      dimensions: {
        width: frame.width,
        height: frame.height
      }
    })

  } catch (error) {
    console.error('❌ Failed to generate thumbnail:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    figma.ui.postMessage({
      type: 'thumbnail-response',
      messageId,
      success: false,
      error: errorMessage
    })
  }
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
    console.log('🔐 Handling authentication request for key:', apiKey.substring(0, 15) + '...')
    const authState = await authController.authenticateWithAPIKey(apiKey)
    console.log('✅ Authentication successful, state:', authState)
    console.log('📤 Auth state should be automatically emitted by AuthController')
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
    console.log('🌐 Opening external URL:', url)

    // Ensure URL is properly formatted
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    console.log('🔗 Final URL:', finalUrl)

    figma.openExternal(finalUrl)
    console.log('✅ Successfully opened external URL:', finalUrl)
  } catch (error) {
    console.error('❌ Failed to open external URL:', error)
    console.error('URL was:', url)
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
