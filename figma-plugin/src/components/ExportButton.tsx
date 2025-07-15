import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Button } from '@create-figma-plugin/ui'
import './ExportButton.css'

export interface ExportProgress {
  stage: 'preparing' | 'exporting' | 'uploading' | 'creating' | 'completed' | 'error'
  current: number
  total: number
  message: string
  percentage: number
  frameName?: string
}

interface ExportResult {
  success: boolean
  slideshowUrl?: string
  projectUrl?: string
  sessionId?: string
  error?: string
  message?: string
}

interface ExportButtonProps {
  selectedFrames: string[]
  isAuthenticated: boolean
  onExport: () => void
  onOpenSlideshow: (url: string) => void
}

export function ExportButton({
  selectedFrames,
  isAuthenticated,
  onExport,
  onOpenSlideshow
}: ExportButtonProps) {
  // Estados internos del botón
  const [buttonState, setButtonState] = useState<'idle' | 'clicking' | 'exporting' | 'completed' | 'opening' | 'error'>('idle')
  const [isHovered, setIsHovered] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Escuchar mensajes de progreso de exportación
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage
      if (!msg) return

      switch (msg.type) {
        case 'export-progress':
          console.log('📊 ExportButton received progress:', msg)
          const data = msg.data || msg
          setButtonState('exporting')
          setExportProgress({
            stage: data.stage || 'exporting',
            current: data.current || 0,
            total: data.total || 1,
            message: data.message || 'Processing...',
            percentage: data.percentage || Math.round(((data.current || 0) / (data.total || 1)) * 100),
            frameName: data.frameName
          })
          break

        case 'export-complete':
          console.log('✅ ExportButton received completion:', msg)
          const result = msg.data || msg
          setButtonState('completed')
          setExportProgress(null)
          setExportResult({
            success: true,
            slideshowUrl: result.projectUrl || `https://anima-production-3dad.up.railway.app/slideshow?sessionId=${result.sessionId}`,
            projectUrl: result.projectUrl,
            sessionId: result.sessionId
          })
          break

        case 'export-error':
          console.error('❌ ExportButton received error:', msg)
          const error = msg.data || msg
          setButtonState('error')
          setExportProgress(null)
          setErrorMessage(error.error || error.message || 'Export failed')
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
  
  // Estado completado - botón para abrir slideshow
  if (buttonState === 'completed' && exportResult?.slideshowUrl) {
    const handleOpenSlideshow = () => {
      console.log('🎬 Opening slideshow and preparing reset...')
      setButtonState('opening')
      onOpenSlideshow(exportResult.slideshowUrl!)
      
      // Reset después de 2 segundos para permitir nueva exportación
      setTimeout(() => {
        console.log('🔄 Resetting to idle state for next export')
        setButtonState('idle')
        setExportResult(null)
        setExportProgress(null)
        setErrorMessage(null)
      }, 2000)
    }

    return (
      <Button
        fullWidth
        onClick={handleOpenSlideshow}
        style={{
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          minHeight: '40px',
          fontWeight: '600',
          color: 'white',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#059669'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#10b981'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1)'
        }}
      >
        🎬 Open in AnimaGen
      </Button>
    )
  }

  // Estado opening - mostrar feedback al abrir slideshow
  if (buttonState === 'opening') {
    return (
      <div style={{
        width: '100%',
        height: '40px',
        backgroundColor: '#f0fdf4',
        border: '2px solid #10b981',
        borderRadius: '8px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {/* Animated dots */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out 0.2s infinite'
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out 0.4s infinite'
          }} />
        </div>
        
        {/* Opening text */}
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#10b981'
        }}>
          🌐 Opening slideshow...
        </div>
      </div>
    )
  }

  // Estado exportando - mostrar progreso dentro del botón
  if (buttonState === 'exporting' && exportProgress) {
    const getStageMessage = () => {
      switch (exportProgress.stage) {
        case 'preparing': return '🔄 Preparing export...'
        case 'exporting': return `📸 Exporting frames... (${exportProgress.current}/${exportProgress.total})`
        case 'uploading': return `☁️ Uploading to AnimaGen... (${exportProgress.current}/${exportProgress.total})`
        case 'creating': return '✨ Creating slideshow...'
        default: return exportProgress.message
      }
    }

    return (
      <div style={{
        width: '100%',
        height: '40px', // Fixed height instead of minHeight
        backgroundColor: '#fef7ff',
        border: '2px solid #ec4899',
        borderRadius: '8px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background progress bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${exportProgress.percentage}%`,
          height: '100%',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          transition: 'width 0.3s ease',
          zIndex: 1
        }} />
        
        {/* Content - just text, no spinner */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          fontSize: '12px',
          fontWeight: '600',
          color: '#ec4899',
          textAlign: 'center'
        }}>
          {getStageMessage()}
        </div>
      </div>
    )
  }

  // Estado error - mostrar error y permitir retry
  if (buttonState === 'error') {
    const handleRetry = async () => {
      console.log('🔄 Retrying export...')
      setButtonState('clicking')
      setErrorMessage(null)
      setExportResult(null)
      setExportProgress(null)
      
      try {
        await onExport()
      } catch (error) {
        console.error('Retry failed:', error)
        setButtonState('error')
        setErrorMessage('Retry failed')
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          width: '100%',
          height: '40px',
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '8px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            ❌ {errorMessage || 'Export failed'}
          </span>
        </div>
        <Button
          fullWidth
          onClick={handleRetry}
          style={{
            backgroundColor: '#ec4899',
            borderColor: '#ec4899',
            minHeight: '36px',
            fontWeight: '600',
            color: 'white',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#db2777'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ec4899'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1)'
          }}
        >
          🔄 Try Again
        </Button>
      </div>
    )
  }

  // Estado por defecto - botón de exportación
  const canExport = selectedFrames.length > 0 && isAuthenticated
  const buttonText = !isAuthenticated
    ? '🔐 Authentication Required'
    : `🚀 Export ${selectedFrames.length} Frame${selectedFrames.length !== 1 ? 's' : ''}`

  // Handle click with immediate state change
  const handleClick = async () => {
    if (!canExport || buttonState !== 'idle') return
    
    console.log('🚀 Export button clicked!')
    setButtonState('clicking')
    
    try {
      await onExport()
    } catch (error) {
      console.error('Export failed:', error)
      setButtonState('error')
      setErrorMessage('Failed to start export')
    }
  }

  // Calculate button styles based on state
  const getButtonStyles = () => {
    const baseStyles = {
      minHeight: '40px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      border: 'none',
      position: 'relative' as const
    }

    if (!canExport) {
      return {
        ...baseStyles,
        backgroundColor: '#d1d5db',
        color: '#9ca3af',
        cursor: 'not-allowed'
      }
    }

    if (buttonState === 'clicking') {
      return {
        ...baseStyles,
        backgroundColor: '#be185d',
        color: 'white',
        transform: 'scale(0.98)',
        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)',
        cursor: 'wait'
      }
    }

    if (isHovered && buttonState === 'idle') {
      return {
        ...baseStyles,
        backgroundColor: '#db2777',
        color: 'white',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
        cursor: 'pointer'
      }
    }

    return {
      ...baseStyles,
      backgroundColor: '#ec4899',
      color: 'white',
      cursor: canExport ? 'pointer' : 'not-allowed'
    }
  }

  return (
    <Button
      fullWidth
      onClick={handleClick}
      disabled={!canExport || buttonState !== 'idle'}
      style={getButtonStyles()}
      onMouseEnter={() => canExport && buttonState === 'idle' && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {buttonState === 'clicking' ? (
        <span>Initializing...</span>
      ) : (
        buttonText
      )}
    </Button>
  )
}
