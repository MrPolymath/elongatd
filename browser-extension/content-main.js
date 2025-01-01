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
    <div class="elongatd-notification-header">
      <h3 class="elongatd-notification-title">View in Elongatd</h3>
      <button class="elongatd-notification-close" title="Close">×</button>
    </div>
    <div class="elongatd-notification-content">
      This thread is available in a better format on Elongatd.
    </div>
    <div class="elongatd-notification-actions">
      <a href="#" class="elongatd-notification-button primary" id="view-thread">View Thread</a>
      <a href="#" class="elongatd-notification-button secondary hidden" id="view-blog">Read Blog</a>
    </div>
  `
    : `
    <div class="elongatd-notification-header">
      <h3 class="elongatd-notification-title">Read in Elongatd</h3>
      <button class="elongatd-notification-close" title="Close">×</button>
    </div>
    <div class="elongatd-notification-content">
      View this thread in a better format on Elongatd.
    </div>
    <div class="elongatd-notification-actions">
      <button class="elongatd-notification-button primary" id="create-and-view">Open in Elongatd</button>
    </div>
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
    // Update notification content for existing thread
    const blogButton = notification.querySelector("#view-blog");
    if (hasBlog) {
      blogButton.classList.remove("hidden");
      blogButton.href = `${baseUrl}/post/${postId}?view=blog`;
    } else {
      blogButton.classList.add("hidden");
    }

    // Update thread button
    const threadButton = notification.querySelector("#view-thread");
    threadButton.href = `${baseUrl}/post/${postId}?view=thread`;
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

  // Add event listeners
  const closeButton = notification.querySelector(
    ".elongatd-notification-close"
  );
  closeButton.onclick = () => {
    notification.remove(); // Remove the element entirely instead of just hiding it
  };
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
