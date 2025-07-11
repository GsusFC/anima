#!/bin/bash
# PM2 Management Commands for AnimaGen

echo "🚀 AnimaGen PM2 Management Commands"
echo "=================================="

case "$1" in
  "start")
    echo "🔧 Starting AnimaGen with PM2..."
    pm2 start ecosystem-stable.config.js
    pm2 list
    echo "✅ Server started. Check status with: npm run pm2:status"
    ;;
    
  "stop")
    echo "🛑 Stopping AnimaGen..."
    pm2 stop animagen-main
    pm2 list
    ;;
    
  "restart")
    echo "🔄 Restarting AnimaGen..."
    pm2 restart animagen-main
    pm2 list
    ;;
    
  "status")
    echo "📊 AnimaGen Status:"
    pm2 list
    echo ""
    echo "📈 Detailed info:"
    pm2 describe animagen-main
    ;;
    
  "logs")
    echo "📝 Showing logs (Ctrl+C to exit):"
    pm2 logs animagen-main --lines 50
    ;;
    
  "monitor")
    echo "📊 Opening PM2 monitor:"
    pm2 monit
    ;;
    
  "reset")
    echo "🧹 Resetting PM2 and clearing logs..."
    pm2 stop all
    pm2 delete all
    pm2 flush
    rm -f logs/*
    echo "✅ PM2 reset complete"
    ;;
    
  "health")
    echo "🏥 Health check:"
    curl -s http://localhost:3001/api/health | jq '.' || echo "Server not responding"
    ;;
    
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|monitor|reset|health}"
    echo ""
    echo "Commands:"
    echo "  start    - Start AnimaGen with PM2"
    echo "  stop     - Stop AnimaGen"
    echo "  restart  - Restart AnimaGen"
    echo "  status   - Show PM2 status"
    echo "  logs     - Show real-time logs"
    echo "  monitor  - Open PM2 monitor dashboard"
    echo "  reset    - Reset PM2 and clear logs"
    echo "  health   - Check server health"
    exit 1
    ;;
esac