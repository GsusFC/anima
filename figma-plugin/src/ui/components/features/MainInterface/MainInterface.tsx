// Main interface component (placeholder)
import React from 'react';
import { AuthState } from '@shared/types';
import styles from './MainInterface.module.css';

interface MainInterfaceProps {
  authState: AuthState;
}

export const MainInterface: React.FC<MainInterfaceProps> = ({ authState }) => {
  return (
    <div className={styles.mainInterface} data-testid="main-interface">
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {authState.user?.name?.charAt(0) || 'U'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{authState.user?.name || 'User'}</span>
            <span className={styles.userPlan}>{authState.user?.plan || 'Free'} Plan</span>
          </div>
        </div>
        <div className={styles.connectionStatus}>
          <span className={styles.statusIndicator}></span>
          <span className={styles.statusText}>Connected</span>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.placeholder}>
          <h2>🎬 Ready to Export!</h2>
          <p>Main interface will be implemented here.</p>
          <p>Features coming soon:</p>
          <ul>
            <li>Frame detection and selection</li>
            <li>Export settings configuration</li>
            <li>Progress tracking</li>
            <li>Export to AnimaGen</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
