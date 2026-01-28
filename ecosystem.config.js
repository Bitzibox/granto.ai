module.exports = {
  apps: [
    {
      name: 'granto-backend',
      script: 'src/index.js',
      cwd: '/opt/granto',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/granto/logs/backend-error.log',
      out_file: '/opt/granto/logs/backend-out.log',
      log_file: '/opt/granto/logs/backend-combined.log',
      time: true
    },
    {
      name: 'granto-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/granto',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/opt/granto/logs/frontend-error.log',
      out_file: '/opt/granto/logs/frontend-out.log',
      log_file: '/opt/granto/logs/frontend-combined.log',
      time: true
    }
  ]
}
