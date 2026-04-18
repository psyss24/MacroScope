/**
 * Configuration file for environment-specific settings
 */

const envApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();

const config = {
  development: {
    apiBaseUrl: 'http://localhost:8000/api',
    environment: 'development'
  },
  production: {
    apiBaseUrl: envApiBaseUrl || 'https://api.saadsaqib.dev/api',
    environment: 'production'
  }
};

// Determine current environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

const currentConfig = (isDevelopment || isLocalhost) 
  ? config.development 
  : config.production;

export default currentConfig; 
