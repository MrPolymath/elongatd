// Store the last TweetDetail response
let lastTweetDetail = null;
let notificationTimeout = null;

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
  notification.className = "thread-extractor-notification hidden";
  notification.innerHTML = exists
    ? `
    <div class="notification-content">
      <h2>🧵 Thread detected</h2>
      <p>There's a better way to read this.</p>
      <div class="notification-buttons">
        <button class="thread-extractor-button" id="viewThreadButton">
          Read better version
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px">
            <path d="M7 17L17 7"/>
            <path d="M7 7h10v10"/>
          </svg>
        </button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
    `
    : `
    <div class="notification-content">
      <h2>🧵 Thread detected</h2>
      <p>There's a better way to read this.</p>
      <div class="notification-buttons">
        <button class="thread-extractor-button" id="create-and-view">
          Create readable version
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px">
            <path d="M7 17L17 7"/>
            <path d="M7 7h10v10"/>
          </svg>
        </button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
  `;

  document.body.appendChild(notification);
  return notification;
}

// Show notification with appropriate buttons
function showNotification(postId, exists = false, hasBlog = false) {
  const notification = createNotification(exists);
  const baseUrl = window.config.apiBaseUrl.replace("/api/threads", "");

  if (exists) {
    const threadButton = notification.querySelector("#viewThreadButton");
    const closeButton = notification.querySelector("#closeButton");

    threadButton.onclick = () => {
      window.open(`${baseUrl}/post/${postId}`, "_blank");
    };

    closeButton.onclick = () => {
      notification.remove();
    };
  } else {
    const createButton = notification.querySelector("#create-and-view");
    const closeButton = notification.querySelector("#closeButton");

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
        createButton.textContent = "Create readable version";
      }
    };

    closeButton.onclick = () => {
      notification.remove();
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
