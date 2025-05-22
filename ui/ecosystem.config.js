module.exports = {
  apps: [
    {
      name: 'XREI',
      script: 'server/index.js',
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 'max',
      exec_mode: 'cluster',
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      merge_logs: true,
      max_memory_restart: '500M',
    },
  ],
  deploy: {
    production: {},
  },
}
