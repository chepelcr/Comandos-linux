const env = import.meta.env;
export const config = {
  region: env.VITE_AWS_REGION || 'us-east-1',
  pool: env.VITE_COGNITO_USER_POOL_ID || '',
  client: env.VITE_COGNITO_CLIENT_ID || '',
  domain: env.VITE_COGNITO_DOMAIN || '',
  redirect: env.VITE_AUTH_REDIRECT_URI || `${location.origin}${import.meta.env.BASE_URL}`,
  logout: env.VITE_AUTH_LOGOUT_URI || `${location.origin}${import.meta.env.BASE_URL}`,
  api: env.VITE_API_BASE_URL || '',
};
export const authConfigured = Boolean(config.pool && config.client && config.domain);
