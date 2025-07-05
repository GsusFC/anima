import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, spacing, typography } from '../design-system/tokens';
import { Button } from '../design-system/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: spacing.xl,
            backgroundColor: colors.bg.primary,
            color: colors.text.primary,
            fontFamily: typography.fontFamily,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.lg,
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '32px' }}>⚠️</div>
          
          <div>
            <h3 style={{ 
              margin: 0, 
              marginBottom: spacing.sm,
              color: colors.status.error,
              fontSize: typography.fontSize.lg
            }}>
              Something went wrong
            </h3>
            <p style={{ 
              margin: 0,
              color: colors.text.secondary,
              fontSize: typography.fontSize.base
            }}>
              The plugin encountered an unexpected error and needs to restart.
            </p>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="primary"
              size="base"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
              }}
            >
              🔄 Try Again
            </Button>
            
            <Button
              variant="secondary"
              size="base"
              onClick={() => {
                navigator.clipboard?.writeText(this.state.error?.stack || 'No error details available');
              }}
            >
              📋 Copy Error
            </Button>
          </div>

          {this.state.error && (
            <details style={{ 
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.bg.secondary,
              borderRadius: '4px',
              fontSize: typography.fontSize.xs,
              maxWidth: '100%',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: spacing.sm }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: colors.text.tertiary
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
