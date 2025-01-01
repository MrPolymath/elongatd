console.log("[Thread Extractor] Isolated world script loaded");

// Store config
let config = null;

// Helper function to make API requests through background script
async function makeAPIRequest(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "API_REQUEST", url }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

// Check if thread exists and show notification
async function checkThreadAndNotify(postId) {
  if (!config) {
    console.error("[Thread Extractor] Config not initialized");
    return;
  }

  try {
    // Check if thread exists in our system
    const existsData = await makeAPIRequest(
      `${config.apiBaseUrl}/${postId}/exists`
    );

    if (existsData.exists) {
      try {
        // Check if blog version exists
        const blogData = await makeAPIRequest(
          `${config.apiBaseUrl}/${postId}/blogify`
        );
        window.postMessage(
          {
            type: "SHOW_NOTIFICATION",
            postId,
            hasBlog: !blogData.error,
          },
          window.location.origin
        );
      } catch (error) {
        // If blogify fails, still show the thread notification
        window.postMessage(
          {
            type: "SHOW_NOTIFICATION",
            postId,
            hasBlog: false,
          },
          window.location.origin
        );
      }
    }
  } catch (error) {
    console.error("[Thread Extractor] Error checking thread:", error);
  }
}

// Listen for messages from the main world
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "CONFIG_UPDATE") {
    config = event.data.config;
    console.log("[Thread Extractor] Received config:", config);
  }

  if (event.data.type === "TWEET_DETAIL_CAPTURED") {
    console.log("[Thread Extractor] Tweet detail captured:", event.data);

    // Get post ID from URL
    const postId = window.location.pathname.split("/status/")[1]?.split("/")[0];
    if (postId) {
      checkThreadAndNotify(postId);
    }
  }
});
