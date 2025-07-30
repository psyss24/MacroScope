/**
 * Configuration file for environment-specific settings
 */

const config = {
  development: {
    apiBaseUrl: 'http://localhost:8000/api',
    environment: 'development'
  },
  production: {
    apiBaseUrl: 'https://macroscope-backend-production.up.railway.app:8080/api',
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