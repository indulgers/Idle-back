module.exports = {
  apps: [
    {
      name: 'nest-user',
      script: 'dist/apps/user/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
