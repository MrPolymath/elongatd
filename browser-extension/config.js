// This will be replaced during build with 'production'
// When developing (loading unpacked), default to development
const ENV = "__BUILD_ENV__" === "production" ? "production" : "development";

const config = {
  development: {
    apiBaseUrl: "http://localhost:3000/api/threads",
  },
  production: {
    apiBaseUrl: "https://www.elongatd.com/api/threads",
  },
};

// Make both ENV and config available globally
window.ENV = ENV;
window.config = config[ENV];
