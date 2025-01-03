const config = {
  development: {
    baseUrl: "localhost:3000",
    apiBaseUrl: "localhost:3000/api/threads",
    authUrl: "localhost:3000",
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
