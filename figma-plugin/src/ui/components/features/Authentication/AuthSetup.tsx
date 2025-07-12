// Authentication setup component
import React, { useState } from 'react';
import { usePluginMessage } from '../../../hooks/usePluginMessage';
import { AuthState } from '@shared/types';
import styles from './AuthSetup.module.css';

interface AuthSetupProps {
  authState: AuthState;
}

export const AuthSetup: React.FC<AuthSetupProps> = ({ authState }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendMessage } = usePluginMessage();

  const handleAuthenticate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    if (!isValidAPIKeyFormat(apiKey)) {
      setError('Invalid API key format. Should start with "ag_figma_"');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      sendMessage({
        type: 'authenticate',
        data: { apiKey: apiKey.trim() }
      });
    } catch (error) {
      setError('Failed to authenticate. Please try again.');
      setIsValidating(false);
    }
  };

  const openAnimaGenDashboard = () => {
    sendMessage({
      type: 'open-external-url',
      data: { url: 'https://animagen.com/dashboard/api-keys' }
    });
  };

  const isValidAPIKeyFormat = (key: string): boolean => {
    return /^ag_figma_[a-zA-Z0-9]{32,}$/.test(key);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setError(null);
  };

  return (
    <div className={styles.authSetup} data-testid="auth-setup">
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🎬</div>
          <h1>AnimaGen Exporter</h1>
        </div>
        <div className={styles.version}>v2.0.0</div>
      </div>

      <div className={styles.content}>
        {authState.expired && (
          <div className={styles.expiredNotice}>
            <span className={styles.expiredIcon}>⚠️</span>
            <div>
              <strong>API Key Expired</strong>
              <p>Your API key has expired. Please generate a new one.</p>
            </div>
          </div>
        )}

        <div className={styles.welcomeMessage}>
          <h2>🚀 Get Started with AnimaGen</h2>
          <p>
            Connect your AnimaGen account to start exporting Figma frames 
            as animated slideshows.
          </p>
        </div>

        <div className={styles.setupSteps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>Get Your API Key</h3>
              <p>Generate a Figma API key from your AnimaGen dashboard</p>
              <button
                className={styles.secondaryButton}
                onClick={openAnimaGenDashboard}
                data-testid="open-dashboard-btn"
              >
                🌐 Open AnimaGen Dashboard
              </button>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>Connect Your Account</h3>
              <div className={styles.inputGroup}>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="ag_figma_..."
                  value={apiKey}
                  onChange={handleKeyChange}
                  disabled={isValidating}
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                  data-testid="api-key-input"
                />
                <button
                  className={styles.toggleButton}
                  onClick={() => setShowKey(!showKey)}
                  disabled={isValidating}
                  data-testid="toggle-key-visibility"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              
              {error && (
                <div className={styles.error} data-testid="auth-error">
                  {error}
                </div>
              )}

              <button
                className={styles.primaryButton}
                onClick={handleAuthenticate}
                disabled={!apiKey.trim() || isValidating}
                data-testid="connect-btn"
              >
                {isValidating ? (
                  <>
                    <span className={styles.spinner}></span>
                    Connecting...
                  </>
                ) : (
                  '🔗 Connect Account'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.securityNote}>
            <span className={styles.securityIcon}>🔒</span>
            <span>Your API key is stored securely and never shared</span>
          </div>
        </div>
      </div>
    </div>
  );
};
