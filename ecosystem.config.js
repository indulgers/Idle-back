module.exports = {
  apps: [
    {
      name: 'nest-gateway',
      script: 'dist/apps/gateway/main.js',
      instances: 'max', // 使用集群模式，根据CPU核心数自动调整
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000, // 网关服务通常在主端口
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/gateway-error.log',
      out_file: 'logs/gateway-out.log',
    },
    {
      name: 'nest-main',
      script: 'dist/apps/main/main.js',
      instances: 2, // 运行两个实例实现负载均衡
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/main-error.log',
      out_file: 'logs/main-out.log',
    },
    {
      name: 'nest-admin',
      script: 'dist/apps/admin/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/admin-error.log',
      out_file: 'logs/admin-out.log',
    },
    {
      name: 'nest-content',
      script: 'dist/apps/content/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/content-error.log',
      out_file: 'logs/content-out.log',
    },
  ],
};
