// Cross-browser runtime API
const runtime = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", async function () {
  // Get UI elements
  const initialView = document.getElementById("initial-view");
  const threadView = document.getElementById("thread-view");
  const openElongatdButton = document.getElementById("open-elongatd");
  const viewThreadButton = document.getElementById("view-thread");
  const readBlogButton = document.getElementById("read-blog");
  const status = document.getElementById("status");
  const envBadge = document.getElementById("envBadge");

  // Show environment badge
  envBadge.textContent = window.config.environment;

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;

  // Check if we're on a thread page
  if (!url || !url.match(/https?:\/\/(twitter|x)\.com\/\w+\/status\/\d+/)) {
    showStatus("Please open a thread on X to use this extension.", "error");
    openElongatdButton.disabled = true;
    return;
  }

  // Extract post ID from URL
  const postId = url.match(/status\/(\d+)/)[1];

  // Check if thread exists in Elongatd
  try {
    const response = await fetch(`${window.config.apiBaseUrl}/${postId}`);
    const exists = response.ok;

    // Show appropriate view
    initialView.classList.toggle("hidden", exists);
    threadView.classList.toggle("hidden", !exists);

    // Add click handlers
    if (exists) {
      const baseUrl = window.config.apiBaseUrl.replace("/api/threads", "");

      viewThreadButton.onclick = () => {
        chrome.tabs.create({ url: `${baseUrl}/post/${postId}` });
      };

      readBlogButton.onclick = () => {
        chrome.tabs.create({ url: `${baseUrl}/post/${postId}` });
      };
    } else {
      openElongatdButton.onclick = async () => {
        try {
          openElongatdButton.disabled = true;
          openElongatdButton.textContent = "Opening...";

          // Send message to content script to create thread
          await chrome.tabs.sendMessage(tab.id, {
            type: "CREATE_AND_VIEW_THREAD",
            postId,
          });

          window.close();
        } catch (error) {
          console.error("Error creating thread:", error);
          showStatus("Failed to create thread. Please try again.", "error");
          openElongatdButton.disabled = false;
          openElongatdButton.textContent = "Open in Elongatd";
        }
      };
    }
  } catch (error) {
    console.error("Error checking thread existence:", error);
    showStatus("Failed to check thread status. Please try again.", "error");
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = type;
    status.style.display = "block";
  }
});
