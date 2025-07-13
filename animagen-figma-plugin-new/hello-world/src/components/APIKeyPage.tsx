import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Container, Text, Button, Textbox, VerticalSpace, LoadingIndicator } from '@create-figma-plugin/ui'

interface APIKeyPageProps {
  apiKey: string
  onApiKeyChange: (value: string) => void
  onAuthenticate: () => void
  error?: string
  isLoading?: boolean
}

export function APIKeyPage({ 
  apiKey, 
  onApiKeyChange, 
  onAuthenticate, 
  error, 
  isLoading 
}: APIKeyPageProps) {
  const [focused, setFocused] = useState(false)
  
  const isValidFormat = apiKey.startsWith('ag_figma_') && apiKey.length > 15
  const canSubmit = isValidFormat && !isLoading

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      
      {/* Header con logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: '#ec4899',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 auto 12px'
        }}>
          A
        </div>
        <Text style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
          AnimaGen Exporter
        </Text>
        <Text style={{ fontSize: '14px', color: '#6b7280' }}>
          Export Figma frames to AnimaGen slideshows
        </Text>
      </div>

      {/* Card de autenticación */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <Text style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          🔐 Authentication Required
        </Text>
        <Text style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          Enter your AnimaGen API key to get started
        </Text>

        {/* Input de API key */}
        <div style={{ marginBottom: '12px' }}>
          <Textbox
            placeholder="ag_figma_..."
            value={apiKey}
            onValueInput={onApiKeyChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            password
            style={{
              borderColor: error ? '#ef4444' : focused ? '#ec4899' : '#d1d5db',
              borderWidth: '2px'
            }}
          />
          
          {/* Indicador de formato */}
          {apiKey && (
            <div style={{ 
              marginTop: '4px', 
              fontSize: '11px',
              color: isValidFormat ? '#10b981' : '#ef4444'
            }}>
              {isValidFormat ? '✓ Valid format' : '⚠ Should start with ag_figma_'}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '12px'
          }}>
            <Text style={{ fontSize: '12px', color: '#dc2626' }}>
              ❌ {error}
            </Text>
          </div>
        )}

        {/* Botón de autenticación */}
        <Button
          fullWidth
          onClick={onAuthenticate}
          disabled={!canSubmit}
          style={{
            backgroundColor: canSubmit ? '#ec4899' : '#d1d5db',
            borderColor: canSubmit ? '#ec4899' : '#d1d5db',
            minHeight: '36px'
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LoadingIndicator />
              <span>Validating...</span>
            </div>
          ) : (
            'Connect to AnimaGen'
          )}
        </Button>
      </div>

      {/* Help text */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        padding: '12px'
      }}>
        <Text style={{ fontSize: '11px', color: '#1e40af' }}>
          💡 <strong>Where to find your API key:</strong><br />
          Go to AnimaGen → Settings → API Keys → Generate new key
        </Text>
      </div>

      <VerticalSpace space="large" />
    </Container>
  )
}
