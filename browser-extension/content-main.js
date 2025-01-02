console.log("[Elongatd] Content script (MAIN) loaded");

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
      document.dispatchEvent(
        new CustomEvent("tweet_detail_captured", {
          detail: { data },
        })
      );
    } catch (err) {
      console.error("[Elongatd] Error processing fetch response:", err);
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
        document.dispatchEvent(
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
