// Placeholder video endpoint for preview compatibility
const express = require('express');

// Placeholder preview endpoint - Return informative response instead of broken video
function addPlaceholderEndpoints(app) {
  app.get('/api/placeholder-preview.mp4', (req, res) => {
    console.log('🎬 Placeholder video preview requested');
    
    // Instead of trying to serve a broken MP4, return a clear response
    res.status(501).json({
      success: false,
      message: 'Preview disabled in stable mode',
      note: 'Server running without video processing capabilities',
      mockMode: true,
      timestamp: new Date().toISOString()
    });
  });

  // Keep GIF endpoint for backward compatibility - redirect to MP4
  app.get('/api/placeholder-preview.gif', (req, res) => {
    console.log('🖼️ Placeholder GIF requested (redirecting to MP4)');
    res.redirect('/api/placeholder-preview.mp4');
  });
}

module.exports = { addPlaceholderEndpoints };