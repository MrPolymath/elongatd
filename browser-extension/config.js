const config = {
  development: {
    baseUrl: "http://localhost:3000",
    apiBaseUrl: "http://localhost:3000/api/threads",
    authUrl: "https://www.elongatd.com",
  },
  production: {
    baseUrl: "https://www.elongatd.com",
    apiBaseUrl: "https://www.elongatd.com/api/threads",
    authUrl: "https://www.elongatd.com",
  },
};

// Use development config when loading as an unpacked extension
const isDevelopment = !chrome.runtime.getManifest().update_url;
const currentConfig = isDevelopment ? config.development : config.production;

// Make config available globally
window.extensionConfig = currentConfig;
