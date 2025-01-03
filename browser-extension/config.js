const config = {
  development: {
    apiBaseUrl: "https://www.elongatd.com/api",
    baseUrl: "https://www.elongatd.com",
    authUrl: "https://www.elongatd.com",
  },
  production: {
    apiBaseUrl: "https://www.elongatd.com/api",
    baseUrl: "https://www.elongatd.com",
    authUrl: "https://www.elongatd.com",
  },
};

// Use development config when loading as an unpacked extension
const isDevelopment = !chrome.runtime.getManifest().update_url;
const currentConfig = isDevelopment ? config.development : config.production;

// Make config available globally
window.extensionConfig = currentConfig;
