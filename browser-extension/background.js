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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "API_REQUEST") {
    const options = {
      ...request.options,
      headers: {
        ...request.options?.headers,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for session cookies
    };

    fetch(request.url, options)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API error: ${response.status} ${response.statusText}${
              errorText ? ` - ${errorText}` : ""
            }`
          );
        }
        const data = await response.json();
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("[Elongatd] API request failed:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Will respond asynchronously
  }
});
