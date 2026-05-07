// PM2 process configuration for Integrity Man Network
// Runs the Next.js standalone server in cluster mode.
// Usage: pm2 start deploy/ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'imn-web',
      cwd: '/var/www/imn/integrity-man-network',
      script: '.next/standalone/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '700M',
      kill_timeout: 5000,
      wait_ready: false,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '127.0.0.1',
      },
      out_file: '/var/log/imn/web.out.log',
      error_file: '/var/log/imn/web.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
