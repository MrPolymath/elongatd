// Cross-browser runtime API
const runtime = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", () => {
  const extractButton = document.getElementById("extract");
  const statusDiv = document.getElementById("status");
  const envBadge = document.getElementById("envBadge");

  // Show current environment
  envBadge.textContent = `ENV: ${window.ENV}`;

  extractButton.addEventListener("click", async () => {
    // Disable button while processing
    extractButton.disabled = true;
    showStatus("Extracting thread data...", "processing");

    try {
      // Query the active tab
      const [tab] = await runtime.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if we're on a Twitter/X page
      if (!tab.url?.match(/https:\/\/(twitter\.com|x\.com)/)) {
        showStatus("Please navigate to a Twitter/X thread first", false);
        extractButton.disabled = false;
        return;
      }

      // Send message to content script
      runtime.tabs.sendMessage(
        tab.id,
        { action: "extractThread" },
        (response) => {
          if (runtime.runtime.lastError) {
            console.error("Runtime error:", runtime.runtime.lastError);
            showStatus(
              "Error: Could not connect to the page. Please refresh and try again.",
              false
            );
            extractButton.disabled = false;
            return;
          }
          handleResponse(response);
        }
      );
    } catch (error) {
      console.error("Error in popup script:", error);
      showStatus(`Error: ${error.message}`, false);
      extractButton.disabled = false;
    }
  });

  function handleResponse(response) {
    extractButton.disabled = false;

    if (!response) {
      showStatus("Error: No response from content script", false);
      return;
    }

    if (response.success) {
      showStatus("Thread extracted successfully!", true);
      console.log("Extracted data:", response.data);
    } else {
      showStatus(`Error: ${response.error || "Unknown error"}`, false);
    }
  }

  function showStatus(message, success) {
    statusDiv.textContent = message;
    statusDiv.style.display = "block";
    statusDiv.className =
      success === true ? "success" : success === false ? "error" : "processing";
  }
});
