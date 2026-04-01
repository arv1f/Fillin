/**
 * pm2 на VPS: cwd должен совпадать с RemoteApiRoot в deploy-api-remote.ps1 (/opt/fillin-api).
 * На сервере создай .env с DATABASE_URL, ADMIN_TOKEN, ADMIN_API_PORT=4000.
 */
module.exports = {
  apps: [
    {
      name: 'fillin-api',
      cwd: '/opt/fillin-api',
      script: 'npm',
      args: 'run server:start',
      interpreter: 'none',
      env: { NODE_ENV: 'production' },
    },
  ],
}
