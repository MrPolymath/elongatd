const ENV = "development"; // Change this to 'production' for production builds

const config = {
  development: {
    apiBaseUrl: "http://localhost:3000/api/threads",
  },
  production: {
    apiBaseUrl: "https://elongatd.com/api/threads",
  },
};

// Make both ENV and config available globally
window.ENV = ENV;
window.config = config[ENV];
