module.exports = {
  apps: [
    {
      name: 'BEM-Backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: 'backend',
      watch: false,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'BEM-Frontend',
      script: 'npx',
      args: 'serve -s dist -l 5000',
      cwd: 'frontend',
      watch: false,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
      },
    }
  ]
};
