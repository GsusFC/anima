// Authentication controller with real API integration
import { AuthState, UserInfo, APIKeyValidation } from '../types';
import { StorageService } from '../services/StorageService';
import { AnimaGenAPIService } from '../services/AnimaGenAPIService';
import { ErrorHandler } from '../utils/ErrorHandler';
import { emit } from '@create-figma-plugin/utilities';

export class AuthController {
  private currentAuthState: AuthState;
  private storageService: StorageService;
  private apiService: AnimaGenAPIService;

  constructor() {
    this.currentAuthState = { authenticated: false, loading: false };
    this.storageService = new StorageService();
    this.apiService = new AnimaGenAPIService();
  }

  async initialize(): Promise<AuthState> {
    try {
      console.log('🔐 Initializing authentication...');

      this.updateAuthState({ loading: true });

      // Check for stored credentials
      const storedAuth = await this.storageService.getStoredAuth();

      if (!storedAuth) {
        console.log('📝 No stored credentials found');
        this.updateAuthState({
          authenticated: false,
          loading: false,
          requiresSetup: true
        });
        return this.currentAuthState;
      }

      // Validate stored credentials
      const validation = await this.validateStoredCredentials(storedAuth);

      if (validation.valid) {
        console.log('✅ Stored credentials valid');
        this.updateAuthState({
          authenticated: true,
          loading: false,
          user: validation.user,
          apiKey: storedAuth.apiKey,
          expiresAt: validation.expiresAt
        });
      } else if (validation.canRenew) {
        console.log('🔄 Attempting credential renewal...');
        const renewal = await this.attemptRenewal(storedAuth.apiKey);

        if (renewal.success) {
          await this.storeCredentials(renewal.newApiKey, renewal.user);
          this.updateAuthState({
            authenticated: true,
            loading: false,
            user: renewal.user,
            apiKey: renewal.newApiKey,
            expiresAt: renewal.expiresAt
          });
        } else {
          this.updateAuthState({
            authenticated: false,
            loading: false,
            requiresSetup: true,
            expired: true
          });
        }
      } else {
        console.log('❌ Stored credentials invalid');
        await this.clearStoredCredentials();
        this.updateAuthState({
          authenticated: false,
          loading: false,
          requiresSetup: true,
          expired: true
        });
      }

      return this.currentAuthState;

    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      ErrorHandler.handleAuthError(error);
      this.updateAuthState({
        authenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.currentAuthState;
    }
  }

  async authenticateWithAPIKey(apiKey: string): Promise<AuthState> {
    try {
      console.log('🔑 Authenticating with API key...');

      this.updateAuthState({ loading: true });

      // Basic API key validation
      if (!apiKey || apiKey.length < 10) {
        throw new Error('API key is too short');
      }

      // Validate with AnimaGen API
      const validation = await this.apiService.validateAPIKey(apiKey);

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid API key');
      }

      if (!validation.user) {
        throw new Error('No user information received');
      }

      // Store credentials securely
      await this.storeCredentials(apiKey, validation.user);

      this.updateAuthState({
        authenticated: true,
        loading: false,
        user: validation.user,
        apiKey,
        expiresAt: validation.expiresAt
      });

      console.log(`✅ Authentication successful for ${validation.user?.email}`);
      return this.currentAuthState;

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      ErrorHandler.handleAuthError(error);
      this.updateAuthState({
        authenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('👋 Logging out...');

      await this.clearStoredCredentials();

      this.updateAuthState({
        authenticated: false,
        loading: false,
        requiresSetup: true
      });

      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  private async validateStoredCredentials(storedAuth: any): Promise<APIKeyValidation> {
    try {
      return await this.apiService.validateAPIKey(storedAuth.apiKey);
    } catch (error) {
      console.error('❌ Stored credential validation failed:', error);
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async attemptRenewal(apiKey: string): Promise<any> {
    try {
      return await this.apiService.renewAPIKey(apiKey);
    } catch (error) {
      console.error('❌ API key renewal failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async storeCredentials(apiKey: string, user: UserInfo): Promise<void> {
    await this.storageService.storeAuth({
      apiKey,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      storedAt: Date.now(),
      lastValidated: Date.now()
    });
  }

  private async clearStoredCredentials(): Promise<void> {
    await this.storageService.clearAuth();
  }

  private isValidAPIKeyFormat(apiKey: string): boolean {
    return /^ag_figma_[a-zA-Z0-9]{15,}$/.test(apiKey);
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.currentAuthState = { ...this.currentAuthState, ...updates };

    // Send to UI using the correct message system
    console.log('📤 Sending auth state update:', this.currentAuthState);
    emit('auth-state-changed', this.currentAuthState);
  }

  getCurrentAuthState(): AuthState {
    return this.currentAuthState;
  }
}
