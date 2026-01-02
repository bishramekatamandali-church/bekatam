module.exports = {
  apps: [
    {
      name: 'BEM-Backend',
      script: 'npm',
      args: 'run dev',
      cwd: 'backend',
      watch: ['backend/src'],
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'BEM-Frontend',
      script: 'serve',
      args: '-s frontend -l 5000',
      watch: ['frontend'],
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'development',
      },
    }
  ]
};
