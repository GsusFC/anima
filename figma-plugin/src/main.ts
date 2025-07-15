import { showUI, on, once, emit } from '@create-figma-plugin/utilities'
import { AuthController } from './controllers/AuthController'
import { AnimaGenAPIService } from './services/AnimaGenAPIService'

// Global instances
let authController: AuthController
let apiService: AnimaGenAPIService

// Selection order tracking
let selectionOrderMap = new Map<string, number>()
let selectionCounter = 0
let lastSelectionIds = new Set<string>()

export default function () {
  console.log('🚀 AnimaGen Plugin Starting...')

  // Initialize services
  authController = new AuthController()
  apiService = new AnimaGenAPIService()

  // Expose debug function globally for testing
  ;(globalThis as any).debugSelectionOrder = debugSelectionOrder

  // Show UI
  showUI({
    width: 500,
    height: 600,
    title: 'AnimaGen Exporter'
  })

  // Set up message handlers
  setupMessageHandlers()

  // Listen for selection changes in Figma
  figma.on('selectionchange', () => {
    console.log('🎯 Selection changed in Figma, updating selection order...')
    updateSelectionOrder()
    detectAndSendFrames()
  })

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

  // Handle all UI messages via native messaging
  figma.ui.onmessage = (msg) => {
    console.log('📨 Received message in main.ts:', msg)

    // Handle both direct messages and pluginMessage wrapper
    const message = msg.pluginMessage || msg
    const messageType = message.type

    if (messageType === 'authenticate') {
      console.log('🔐 Processing authenticate message:', message)
      handleAuthValidation(message.apiKey)
    } else if (messageType === 'export-frames') {
      console.log('📨 Processing export-frames message:', message)
      handleFrameExport(message.frameIds, message.settings)
    } else if (messageType === 'detect-frames') {
      console.log('🔍 Processing detect-frames message')
      detectAndSendFrames()
    } else if (messageType === 'generate-thumbnail') {
      console.log('📸 Processing thumbnail generation:', message)
      handleThumbnailGeneration(message.frameId, message.messageId)
    } else if (messageType === 'open-external-url') {
      console.log('🔗 Processing open external URL:', message)
      handleOpenExternalUrl(message.url)
    } else {
      console.log('❓ Unknown message type:', messageType, 'Full message:', msg)
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

function debugSelectionOrder() {
  console.log('🐛 DEBUG: Selection Order State')
  console.log('📊 Selection counter:', selectionCounter)
  console.log('📊 Selection order map size:', selectionOrderMap.size)
  console.log('📊 Last selection IDs size:', lastSelectionIds.size)

  console.log('🗺️ Current selection order map:')
  selectionOrderMap.forEach((index, id) => {
    const frame = figma.getNodeById(id) as FrameNode
    const frameName = frame?.name || 'DELETED'
    console.log(`   ${index}: "${frameName}" (${id})`)
  })

  console.log('🎯 Current Figma selection:')
  figma.currentPage.selection
    .filter(node => node.type === 'FRAME')
    .forEach((frame, index) => {
      const selectionIndex = selectionOrderMap.get(frame.id)
      console.log(`   ${index}: "${frame.name}" (${frame.id}) - selectionIndex: ${selectionIndex}`)
    })
}

function updateSelectionOrder() {
  console.log('📋 Updating selection order tracking...')

  // Get current selection IDs (only frames)
  const currentSelectionIds = new Set(
    figma.currentPage.selection
      .filter(node => node.type === 'FRAME')
      .map(node => node.id)
  )

  console.log('🔍 Current selection IDs:', [...currentSelectionIds])
  console.log('🔍 Previous selection IDs:', [...lastSelectionIds])

  // Find newly selected frames (not in previous selection)
  const newlySelected = [...currentSelectionIds].filter(id => !lastSelectionIds.has(id))

  // Find deselected frames (in previous selection but not current)
  const deselected = [...lastSelectionIds].filter(id => !currentSelectionIds.has(id))

  console.log('🆕 Newly selected frames:', newlySelected)
  console.log('❌ Deselected frames:', deselected)

  // Remove deselected frames from order map
  deselected.forEach(id => {
    const frame = figma.getNodeById(id) as FrameNode
    const frameName = frame?.name || id
    selectionOrderMap.delete(id)
    console.log(`🗑️ Removed frame "${frameName}" (${id}) from selection order`)
  })

  // Add newly selected frames to order map
  newlySelected.forEach(id => {
    const frame = figma.getNodeById(id) as FrameNode
    const frameName = frame?.name || id
    selectionOrderMap.set(id, selectionCounter++)
    console.log(`➕ Added frame "${frameName}" (${id}) to selection order with index ${selectionCounter - 1}`)
  })

  // Update last selection for next comparison
  lastSelectionIds = new Set(currentSelectionIds)

  console.log(`📊 Selection order map now has ${selectionOrderMap.size} frames`)
  console.log('🗺️ Current selection order map:')
  selectionOrderMap.forEach((index, id) => {
    const frame = figma.getNodeById(id) as FrameNode
    const frameName = frame?.name || id
    console.log(`   ${index}: "${frameName}" (${id})`)
  })
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

    // Reset selection tracking when no frames are selected
    selectionOrderMap.clear()
    selectionCounter = 0
    lastSelectionIds.clear()
    console.log('🔄 Reset selection tracking - no frames selected')

    emit('frames-detected', {
      frames: [],
      figmaSelection: []
    })
    return
  }

  console.log('📋 Selected frame names:', selectedFrames.map(f => f.name))
  console.log('📋 Selected frame IDs:', selectedFrames.map(f => f.id))

  // Debug: Show current selection order map before sorting
  console.log('🗺️ Selection order map before sorting:')
  selectionOrderMap.forEach((index, id) => {
    const frame = figma.getNodeById(id) as FrameNode
    console.log(`   ${index}: "${frame?.name}" (${id})`)
  })

  // Sort frames by selection order
  const sortedFrames = selectedFrames.sort((a, b) => {
    const orderA = selectionOrderMap.get(a.id) ?? 999999
    const orderB = selectionOrderMap.get(b.id) ?? 999999
    console.log(`🔄 Comparing "${a.name}" (${orderA}) vs "${b.name}" (${orderB})`)
    return orderA - orderB
  })

  console.log('🔢 Frames sorted by selection order:', sortedFrames.map(f => `${f.name} (${selectionOrderMap.get(f.id)})`))

  // Map frames with both display order and selection order
  const detectedFrames = sortedFrames.map((frame, displayIndex) => {
    const complexity = estimateComplexity(frame)
    const selectionIndex = selectionOrderMap.get(frame.id) ?? displayIndex

    console.log(`📝 Mapping frame "${frame.name}": displayIndex=${displayIndex}, selectionIndex=${selectionIndex}`)

    return {
      id: frame.id,
      name: frame.name,
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      x: Math.round(frame.x),
      y: Math.round(frame.y),
      order: displayIndex, // Display order (0, 1, 2, ...)
      selectionIndex: selectionIndex, // Original selection order
      complexity,
      isValidForExport: true,
      estimatedSize: estimateFileSize(frame.width, frame.height, complexity),
      selected: false,
      visible: frame.visible,
      locked: frame.locked,
      aspectRatio: frame.width / frame.height
    }
  })

  console.log('📤 Final detected frames order:', detectedFrames.map(f => `${f.name} (order: ${f.order}, selectionIndex: ${f.selectionIndex})`));

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

async function handleAuthValidation(apiKey?: string) {
  try {
    console.log('🔍 Validating authentication...')

    // If apiKey is provided, authenticate with it
    if (apiKey) {
      console.log('🔑 API Key provided, authenticating...')
      await handleAuthentication(apiKey)
      return
    }

    // Otherwise just validate current state
    console.log('🔍 Checking current auth state...')
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
  console.log('🚀 handleFrameExport called!')
  console.log('📤 Starting frame export and upload to AnimaGen...')
  console.log('🎯 Frame IDs to export:', frameIds)
  console.log('⚙️ Export settings:', settings)

  // Send export started message
  figma.ui.postMessage({
    type: 'export-progress',
    stage: 'generating',
    current: 0,
    total: frameIds.length,
    message: 'Starting export...'
  })

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

  // Sort frame IDs by selection order before processing
  const sortedFrameIds = frameIds.sort((a, b) => {
    const orderA = selectionOrderMap.get(a) ?? 999999
    const orderB = selectionOrderMap.get(b) ?? 999999
    return orderA - orderB
  })

  console.log('🔢 Frame IDs sorted by selection order:', sortedFrameIds.map(id => {
    const frame = figma.getNodeById(id) as FrameNode
    return `${frame?.name || id} (${selectionOrderMap.get(id)})`
  }))

  const frameResults = []

  // Phase 1: Export frames from Figma (in selection order)
  console.log(`🎯 Starting export of ${sortedFrameIds.length} frames in selection order:`, sortedFrameIds)

  for (let i = 0; i < sortedFrameIds.length; i++) {
    const frameId = sortedFrameIds[i]
    console.log(`📸 Processing frame ${i + 1}/${frameIds.length}: ${frameId}`)

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
      // Export frame with user-configured settings (basic settings only)
      const exportSettings: any = {
        format: settings.format || 'JPG',
        constraint: {
          type: 'SCALE',
          value: settings.scale || 1
        }
      };

      // Note: Figma API doesn't support quality settings in exportAsync
      // Quality will be handled at post-processing level if needed

      // Validate export settings
      if (exportSettings.quality && (exportSettings.quality < 0.1 || exportSettings.quality > 1.0)) {
        console.warn(`⚠️ Invalid quality value ${exportSettings.quality}, using 0.8`);
        exportSettings.quality = 0.8;
      }

      if (exportSettings.constraint.value < 1 || exportSettings.constraint.value > 4) {
        console.warn(`⚠️ Invalid scale value ${exportSettings.constraint.value}, using 1`);
        exportSettings.constraint.value = 1;
      }

      console.log(`📸 Exporting frame "${frame.name}" with settings:`, exportSettings);

      const imageData = await frame.exportAsync(exportSettings)

      const selectionIndex = selectionOrderMap.get(frameId) ?? i

      frameResults.push({
        success: true,
        frameId,
        frameName: frame.name,
        imageData: imageData,
        metadata: {
          width: frame.width,
          height: frame.height
        },
        order: i, // Processing order (0, 1, 2, ...)
        selectionIndex: selectionIndex, // Original selection order
        exportTime: Date.now(),
        fileSize: imageData.length
      })

      console.log(`✅ Exported frame: ${frame.name} (${imageData.length} bytes)`)

    } catch (error) {
      console.error(`❌ Failed to export frame ${frame.name}:`, error)

      const selectionIndex = selectionOrderMap.get(frameId) ?? i

      frameResults.push({
        success: false,
        frameId,
        frameName: frame.name,
        error: (error as Error).message,
        order: i, // Processing order
        selectionIndex: selectionIndex, // Original selection order
        exportTime: Date.now()
      })
    }

    // Small delay to prevent overwhelming Figma
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Phase 2: Upload to AnimaGen
  console.log(`📤 Phase 2: Uploading ${frameResults.length} frames to AnimaGen`)
  console.log(`📊 Export results summary:`)
  frameResults.forEach((result, index) => {
    console.log(`  Frame ${index + 1}: ${result.frameName} - ${result.success ? '✅ Success' : '❌ Failed'}`)
  })

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
