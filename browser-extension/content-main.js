// Store the last TweetDetail response
let lastTweetDetail = null;
let notificationTimeout = null;

console.log("[Thread Extractor] Main world script loaded");

// Send config to isolated world
window.postMessage(
  {
    type: "CONFIG_UPDATE",
    config: {
      apiBaseUrl: window.config.apiBaseUrl,
    },
  },
  window.location.origin
);

// Create notification element
function createNotification(exists = true) {
  const notification = document.createElement("div");
  notification.className = "elongatd-notification hidden";
  notification.innerHTML = exists
    ? `
    <div class="notification-content">
      <h2>View in Elongatd</h2>
      <p>This thread is available in a better format on Elongatd.</p>
      <div class="notification-buttons">
        <button class="notification-button thread-button" id="viewThreadButton">View Thread</button>
        <button class="notification-button blog-button" id="readBlogButton">Read Blog</button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
    `
    : `
    <div class="notification-content">
      <h2>Read in Elongatd</h2>
      <p>View this thread in a better format on Elongatd.</p>
      <div class="notification-buttons">
        <button class="notification-button blog-button" id="create-and-view">Open in Elongatd</button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
  `;

  document.body.appendChild(notification);
  return notification;
}

// Show notification with appropriate buttons
function showNotification(postId, exists = false, hasBlog = false) {
  // Always create a new notification
  const notification = createNotification(exists);
  const baseUrl = window.config.apiBaseUrl.replace("/api/threads", "");

  if (exists) {
    // Add click handlers for thread and blog buttons
    const threadButton = notification.querySelector("#viewThreadButton");
    const blogButton = notification.querySelector("#readBlogButton");
    const closeButton = notification.querySelector("#closeButton");

    threadButton.onclick = () => {
      window.open(`${baseUrl}/post/${postId}?view=thread`, "_blank");
    };

    blogButton.onclick = () => {
      window.open(`${baseUrl}/post/${postId}?view=blog`, "_blank");
    };

    closeButton.onclick = () => {
      notification.remove();
    };
  } else {
    // Add click handler for create-and-view button
    const createButton = notification.querySelector("#create-and-view");
    createButton.onclick = async () => {
      try {
        // Disable button and show loading state
        createButton.disabled = true;
        createButton.textContent = "Opening...";

        // Send message to isolated world to trigger thread creation
        window.postMessage(
          { type: "CREATE_AND_VIEW_THREAD", postId },
          window.location.origin
        );
      } catch (error) {
        // Reset button state on error
        createButton.disabled = false;
        createButton.textContent = "Open in Elongatd";
        console.error("[Thread Extractor] Error creating thread:", error);
      }
    };
  }

  // Show notification
  notification.classList.remove("hidden");
}

// Save original fetch and XHR
const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;

// Override fetch
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  const url = args[0] instanceof Request ? args[0].url : args[0];

  if (url.includes("/graphql/") && url.includes("/TweetDetail?")) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      window.postMessage(
        { type: "TWEET_DETAIL_CAPTURED", data },
        window.location.origin
      );
    } catch (err) {
      console.error("[Thread Extractor] Error processing response:", err);
    }
  }
  return response;
};

// Override XHR
XMLHttpRequest.prototype.open = function (method, url, ...args) {
  if (url.includes("/graphql/") && url.includes("/TweetDetail?")) {
    this.addEventListener("load", function () {
      try {
        const data = JSON.parse(this.responseText);
        window.postMessage(
          { type: "TWEET_DETAIL_CAPTURED", data },
          window.location.origin
        );
      } catch (err) {
        console.error("[Thread Extractor] Error processing XHR response:", err);
      }
    });
  }
  return originalXHROpen.apply(this, [method, url, ...args]);
};

// Listen for messages from the isolated world
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "SHOW_NOTIFICATION") {
    const { postId, exists, hasBlog } = event.data;
    showNotification(postId, exists, hasBlog);
  }
});
