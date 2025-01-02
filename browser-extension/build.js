const fs = require("fs");
const path = require("path");

// Read the config file
const configPath = path.join(__dirname, "config.js");
let configContent = fs.readFileSync(configPath, "utf8");

// Replace the build environment token with 'production'
configContent = configContent.replace("__BUILD_ENV__", "production");

// Create a dist directory if it doesn't exist
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Write the modified config to the dist directory
fs.writeFileSync(path.join(distDir, "config.js"), configContent);

// Copy other necessary files to dist
const filesToCopy = [
  "manifest.json",
  "popup.html",
  "background.js",
  "content-main.js",
  "content-isolated.js",
  "notification.css",
];

filesToCopy.forEach((file) => {
  fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
});

// Copy icons directory
const iconsDir = path.join(__dirname, "icons");
const distIconsDir = path.join(distDir, "icons");
if (fs.existsSync(iconsDir)) {
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir);
  }
  fs.readdirSync(iconsDir).forEach((file) => {
    fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
  });
}

console.log("Build completed! Files are in the dist directory.");
