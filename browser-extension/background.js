// Service worker initialization
self.addEventListener("install", (event) => {
  console.log("[Elongatd] Service worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("[Elongatd] Service worker activated");
});

// Function that will be injected into the page
function injectInterceptors() {
  // Save original fetch and XHR
  const originalFetch = (window._fetch = window.fetch);
  const originalXHROpen = (window._xhrOpen = XMLHttpRequest.prototype.open);

  // Override fetch
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];

    if (url.includes("/graphql/") && url.includes("/TweetDetail?")) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        window.dispatchEvent(
          new CustomEvent("tweet_detail_captured", {
            detail: { data },
          })
        );
      } catch (err) {
        console.error("[Elongatd] Error processing response:", err);
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
          window.dispatchEvent(
            new CustomEvent("tweet_detail_captured", {
              detail: { data },
            })
          );
        } catch (err) {
          console.error("[Elongatd] Error processing XHR response:", err);
        }
      });
    }
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
}

// Listen for tab updates to inject our script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("x.com")) {
    chrome.scripting
      .executeScript({
        target: { tabId },
        func: injectInterceptors,
        world: "MAIN",
      })
      .catch((err) =>
        console.error("[Elongatd] Failed to inject script:", err)
      );
  }
});

// Handle API requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "API_REQUEST") {
    fetch(message.url, {
      ...message.options,
      credentials: "include", // Always include credentials
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "API request failed");
        }
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});
