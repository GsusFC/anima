/**
 * AnimaGen Backend - Authentication Routes Module
 * 
 * This module provides authentication endpoints for the AnimaGen backend,
 * including API key generation and validation.
 */

import express, { Request, Response } from 'express';
import { 
  AuthResponse, 
  APIKey, 
  APIKeysStore 
} from '../types';
import config from '../config';
import { 
  asyncHandler, 
  generateAPIKey, 
  loadAPIKeys, 
  saveAPIKeys, 
  validateAPIKey 
} from '../utils';

// Create router
const router = express.Router();

/**
 * Generate API key endpoint
 * POST /api/auth/generate-key
 */
router.post('/generate-key', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('🔑 API Key generation requested');
    
    const { email, name, purpose } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }
    
    // Generate new API key
    const apiKey = generateAPIKey();
    
    const keyData: APIKey = {
      key: apiKey,
      email: email,
      name: name,
      purpose: purpose || 'Figma Plugin Access',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      active: true
    };
    
    // Load existing keys and add new one
    const apiKeys = loadAPIKeys();
    apiKeys[apiKey] = keyData;
    
    if (saveAPIKeys(apiKeys)) {
      console.log('✅ API Key generated successfully for:', email);
      
      const response: AuthResponse = {
        success: true,
        valid: true,
        apiKey: apiKey,
        user: {
          id: `user_${apiKey.substring(0, 8)}`,
          email: email,
          name: name,
          plan: 'Pro',
          permissions: ['export', 'upload', 'create_slideshow']
        },
        message: 'API key generated successfully',
      };
      
      res.json(response);
    } else {
      throw new Error('Failed to save API key');
    }
  } catch (error) {
    console.error('❌ API Key generation error:', error);
    
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Failed to generate API key',
      details: (error as Error).message
    });
  }
}));

/**
 * Validate API key endpoint
 * POST /api/auth/validate
 */
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('🔐 API Key validation requested');
    
    const authHeader = req.headers.authorization;
    const { source, version } = req.body;
    
    // Development mode OR Figma plugin: bypass authentication
    const isDevelopment = config.isDevelopment();
    const isFigmaPlugin = source === 'figma-plugin' || req.headers['user-agent']?.includes('figma');
    
    if (isDevelopment || isFigmaPlugin) {
      console.log('🔓 Bypassing authentication for:', isDevelopment ? 'development mode' : 'Figma plugin');
      
      return res.json({
        success: true,
        valid: true,
        user: {
          id: isFigmaPlugin ? 'figma_user' : 'dev_user',
          email: isFigmaPlugin ? 'figma@animagen.app' : 'dev@animagen.local',
          name: isFigmaPlugin ? 'Figma Plugin User' : 'Development User',
          plan: 'Pro',
          permissions: ['export', 'upload', 'create_slideshow']
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    }
    
    // Production mode: validate API key
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Missing or invalid authorization header'
      });
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    
    // Validate API key
    const { valid, keyData } = validateAPIKey(apiKey);
    
    if (!valid || !keyData) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Invalid API key. Please generate a new key at /api/auth/generate-key'
      });
    }
    
    console.log('✅ API Key validation successful for:', keyData.email);
    
    // Return user information
    res.json({
      success: true,
      valid: true,
      user: {
        id: `user_${apiKey.substring(0, 8)}`,
        email: keyData.email,
        name: keyData.name,
        plan: 'Pro',
        permissions: ['export', 'upload', 'create_slideshow']
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });
  } catch (error) {
    console.error('❌ API Key validation error:', error);
    
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Internal server error during validation',
      details: (error as Error).message
    });
  }
}));

export default router;
