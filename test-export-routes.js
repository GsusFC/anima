#!/usr/bin/env node

/**
 * Test the export routes module directly
 */

console.log('🧪 Testing export routes module...');

try {
  console.log('📦 Loading export routes...');
  const exportRoutes = require('./backend/routes/export.js');
  console.log('✅ Export routes loaded successfully');
  console.log('Routes object:', typeof exportRoutes);
  
  // Test if it's an Express router
  if (exportRoutes && typeof exportRoutes === 'function') {
    console.log('✅ Export routes is a valid Express router');
  } else {
    console.log('❌ Export routes is not a valid Express router');
  }
  
} catch (error) {
  console.error('❌ Failed to load export routes:', error.message);
  console.error('Stack:', error.stack);
}
