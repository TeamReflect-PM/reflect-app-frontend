// API Configuration for different environments

// Detect if we're in Cloud Shell environment
const isCloudShell = window.location.hostname.includes('cloudshell.dev');
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configure API base URL based on environment
let API_BASE_URL;

API_BASE_URL = 'https://reflect-git-backend-latest-18772936840.us-central1.run.app'

console.log('=== API CONFIG DEBUG ===');
console.log('Current hostname:', window.location.hostname);
console.log('Current full URL:', window.location.href);
console.log('Is Cloud Shell:', isCloudShell);
console.log('Is Local:', isLocal);
console.log('Final API Base URL:', API_BASE_URL);
console.log('========================');

export { API_BASE_URL };

// Helper function to build API URLs
export const buildApiUrl = (endpoint, params = '') => {
  return `${API_BASE_URL}${endpoint}${params}`;
};