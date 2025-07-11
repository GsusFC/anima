// PM2 Ecosystem configuration for AnimaGen - Stable Mode
module.exports = {
  apps: [
    {
      name: 'animagen-main',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      
      // Memory and restart policies
      max_memory_restart: '256M',
      min_uptime: '10s',          // Must stay up 10s to be considered started
      max_restarts: 10,           // Max restarts per minute
      restart_delay: 4000,        // Wait 4s between restarts
      
      // Timeouts
      listen_timeout: 3000,       // Time to wait for app to listen
      kill_timeout: 5000,         // Time to wait before SIGKILL
      
      // Exponential backoff for failing restarts
      exp_backoff_restart_delay: 100,
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3001
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced options
      kill_retry_time: 100,
      ignore_watch: [
        'node_modules',
        'logs',
        'temp',
        'uploads',
        'output',
        '*.log'
      ]
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:username/animagen.git',
      path: '/var/www/animagen',
      'post-deploy': 'npm install && pm2 reload ecosystem-stable.config.js --env production'
    }
  }
};