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
    // Detailed logging of the full request
    console.log("[Elongatd] Full request details:", {
      url: message.url,
      method: message.options.method || "GET",
      headers: message.options.headers,
      body: message.options.body
        ? message.options.body.substring(0, 100) + "..."
        : undefined,
      credentials: message.options.credentials,
    });

    // Create a new options object with properly handled body
    const fetchOptions = {
      method: message.options.method || "GET",
      headers: message.options.headers || {},
      credentials: "include",
      mode: "cors",
      body: message.options.body,
    };

    // Log the actual request being sent
    console.log("[Elongatd] Sending request:", {
      url: message.url,
      method: fetchOptions.method,
      headers: fetchOptions.headers,
      bodyLength: fetchOptions.body ? fetchOptions.body.length : 0,
    });

    fetch(message.url, fetchOptions)
      .then(async (response) => {
        // Log response details
        const responseHeaders = Object.fromEntries(response.headers.entries());
        console.log("[Elongatd] Response details:", {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url,
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("[Elongatd] Failed to parse response as JSON:", text);
          throw new Error("Invalid response format");
        }

        console.log("[Elongatd] Response body:", data);

        if (!response.ok) {
          if (
            response.status === 401 ||
            data.error === "Authentication required"
          ) {
            throw new Error("Please log in to elongatd.com first");
          }
          throw new Error(data.error || "API request failed");
        }
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("[Elongatd] Request failed:", {
          error,
          message: error.message,
          url: message.url,
          method: fetchOptions.method,
          headers: fetchOptions.headers,
        });
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
