const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');

// Define supported formats
const SUPPORTED_FORMATS = ['mp4', 'webm', 'mov', 'gif'];

router.post('/:format', async (req, res) => {
  try {
    console.log('🎬 [UNIFIED EXPORT] Request received:', JSON.stringify(req.body, null, 2));
    
    // Validate format
    const format = req.params.format.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported format: ${format}. Supported: ${SUPPORTED_FORMATS.join(', ')}`
      });
    }
    
    // Extract basic parameters for logging
    const { images, sessionId } = req.body;
    console.log(`🎬 [UNIFIED EXPORT] Request for ${format}, images: ${images?.length}, sessionId: ${sessionId}`);
    
    // Basic validation
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No images provided' 
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }
    
    // Prepare options for the export service
    const exportOptions = {
      ...req.body,
      format
    };
    
    // Delegate to the export service
    const result = await exportService.createExport(exportOptions);
    
    // Handle the result
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Failed to process unified export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process export',
      details: error.message
    });
  }
});

module.exports = router;
