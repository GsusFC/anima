// Main plugin entry point
import { FrameController } from './controllers/FrameController';
import { ExportController } from './controllers/ExportController';
import { AuthController } from './controllers/AuthController';
import { MessageHandler } from './services/MessageHandler';
import { ErrorHandler } from './utils/ErrorHandler';

class AnimaGenPlugin {
  private frameController: FrameController;
  private exportController: ExportController;
  private authController: AuthController;
  private messageHandler: MessageHandler;

  constructor() {
    this.frameController = new FrameController();
    this.exportController = new ExportController();
    this.authController = new AuthController();
    this.messageHandler = new MessageHandler();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing AnimaGen Plugin...');
      
      // Show UI according to Figma best practices
      figma.showUI(__html__, { 
        width: 400, 
        height: 600,
        themeColors: true // Enable Figma theme support
      });

      // Set up message handling
      this.setupMessageHandling();
      
      // Initialize authentication
      await this.authController.initialize();
      
      // Detect initial frames
      await this.frameController.detectFrames();
      
      console.log('✅ Plugin initialized successfully');
      
    } catch (error) {
      console.error('❌ Plugin initialization failed:', error);
      ErrorHandler.handleInitializationError(error);
    }
  }

  private setupMessageHandling(): void {
    figma.ui.onmessage = async (message) => {
      try {
        await this.messageHandler.handleMessage(message, {
          frameController: this.frameController,
          exportController: this.exportController,
          authController: this.authController
        });
      } catch (error) {
        console.error('❌ Message handling error:', error);
        ErrorHandler.handleMessageError(error, message);
      }
    };
  }
}

// Initialize plugin following Figma conventions
new AnimaGenPlugin();
