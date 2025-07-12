// Message handling service for plugin-UI communication
import { FrameController } from '../controllers/FrameController';
import { ExportController } from '../controllers/ExportController';
import { AuthController } from '../controllers/AuthController';
import { PluginMessage } from '@shared/types';

interface Controllers {
  frameController: FrameController;
  exportController: ExportController;
  authController: AuthController;
}

export class MessageHandler {
  async handleMessage(message: PluginMessage, controllers: Controllers): Promise<void> {
    const { type, data } = message;
    
    console.log(`📨 Handling message: ${type}`, data);
    
    try {
      switch (type) {
        case 'ui-ready':
          await this.handleUIReady(controllers);
          break;
          
        case 'detect-frames':
          await controllers.frameController.detectFrames();
          break;
          
        case 'authenticate':
          await controllers.authController.authenticateWithAPIKey(data.apiKey);
          break;
          
        case 'validate-auth':
          await controllers.authController.initialize();
          break;
          
        case 'export-frames':
          await controllers.exportController.exportFrames(data.frameIds, data.settings);
          break;
          
        case 'cancel-export':
          controllers.exportController.cancelExport();
          break;
          
        case 'logout':
          await controllers.authController.logout();
          break;
          
        case 'refresh-frames':
          await controllers.frameController.refreshFrameDetection();
          break;
          
        case 'open-external-url':
          this.openExternalURL(data.url);
          break;
          
        case 'close-plugin':
          figma.closePlugin();
          break;
          
        default:
          console.warn(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to handle message ${type}:`, error);
      
      figma.ui.postMessage({
        type: 'error',
        data: {
          error: error.message,
          originalMessage: type,
          code: 'MESSAGE_HANDLER_ERROR'
        }
      });
    }
  }
  
  private async handleUIReady(controllers: Controllers): Promise<void> {
    console.log('🎨 UI is ready, sending initial state...');
    
    // Send initial state to UI
    figma.ui.postMessage({
      type: 'plugin-ready',
      data: {
        version: '2.0.0',
        figmaVersion: figma.version,
        user: figma.currentUser,
        timestamp: Date.now()
      }
    });
    
    // Initialize authentication state
    await controllers.authController.initialize();
    
    // Detect frames immediately if authenticated
    const authState = controllers.authController.getCurrentAuthState();
    if (authState.authenticated) {
      await controllers.frameController.detectFrames();
    }
  }
  
  private openExternalURL(url: string): void {
    try {
      // Note: Figma plugins can't directly open URLs
      // This would need to be handled by the UI
      figma.ui.postMessage({
        type: 'open-url-response',
        data: {
          url,
          message: 'Please open this URL in your browser'
        }
      });
    } catch (error) {
      console.error('Failed to handle URL opening:', error);
    }
  }
}
