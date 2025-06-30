// Simple test server for Railway debugging
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting simple server...');
console.log('🔧 PORT:', PORT);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

app.get('/', (req, res) => {
  console.log('📍 Root endpoint hit');
  res.send(`
    <h1>AnimaGen Simple Server</h1>
    <p>Status: ✅ Running</p>
    <p>Port: ${PORT}</p>
    <p>Time: ${new Date().toISOString()}</p>
  `);
});

app.get('/api/health', (req, res) => {
  console.log('🏥 Health check hit');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on 0.0.0.0:${PORT}`);
});
