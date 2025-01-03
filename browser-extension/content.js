console.log("[Elongatd] Content script (Isolated) loaded");

// Store the last TweetDetail response and auth status
let lastTweetDetail = null;
let notificationTimeout = null;
let authStatus = null;
let authExpires = null;
let lastUrl = window.location.href;

// Helper function to check if current URL is a tweet page
function isTweetPage() {
  return window.location.href.match(
    /^https?:\/\/(www\.)?x\.com\/[^/]+\/status\/\d+/
  );
}

// Helper function to remove notification if it exists
function removeNotification() {
  const existingNotification = document.querySelector(
    ".thread-extractor-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }
}

// Check for URL changes periodically
setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log("[Elongatd] URL changed:", currentUrl);
    lastUrl = currentUrl;

    if (!isTweetPage()) {
      console.log("[Elongatd] Not a tweet page, removing notification");
      removeNotification();
    }
  }
}, 500);

// Development helper to clear storage
async function clearStorageForDev() {
  if (!chrome.runtime.getManifest().update_url) {
    console.log("[Elongatd] Development mode - clearing storage");
    await chrome.storage.local.clear();
    authStatus = null;
    authExpires = null;
    console.log("[Elongatd] Storage cleared");
  }
}

// Initialize auth status from storage and check current status if needed
async function initializeAuthStatus() {
  try {
    // First get from storage
    const result = await chrome.storage.local.get([
      "authStatus",
      "authExpires",
    ]);
    console.log("[Elongatd] Loaded auth status from storage:", result);

    // If we have a valid non-expired auth status, use it
    if (result.authStatus !== undefined && result.authExpires) {
      const now = new Date();
      const expiresDate = new Date(result.authExpires);
      if (expiresDate > now) {
        console.log(
          "[Elongatd] Using cached auth status, valid until:",
          expiresDate
        );
        authStatus = result.authStatus;
        authExpires = result.authExpires;
        return;
      }
    }

    // Otherwise check current status
    try {
      const response = await makeAPIRequest(`/api/auth/session`, {
        credentials: "include",
      });
      const isAuthenticated = !!response?.user;
      const expires = response?.expires;

      console.log(
        "[Elongatd] Checked current auth status:",
        isAuthenticated,
        "expires:",
        expires
      );

      if (isAuthenticated !== authStatus || expires !== authExpires) {
        authStatus = isAuthenticated;
        authExpires = expires;
        await chrome.storage.local.set({ authStatus, authExpires });
      }
    } catch (error) {
      console.error("[Elongatd] Error checking auth status:", error);
    }
  } catch (error) {
    console.error("[Elongatd] Error initializing auth status:", error);
  }
}

// Initialize auth status when script loads
initializeAuthStatus().catch((error) => {
  if (error.message.includes("Extension context invalidated")) {
    console.log("[Elongatd] Extension context invalidated, reloading page");
    window.location.reload();
  }
});

// Also check auth status when tab becomes visible (user might have logged in in another tab)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("[Elongatd] Tab became visible, checking auth status");
    initializeAuthStatus().catch((error) => {
      if (error.message.includes("Extension context invalidated")) {
        console.log("[Elongatd] Extension context invalidated, reloading page");
        window.location.reload();
      }
    });
  }
});

// Helper function to estimate tokens in a string (rough estimation)
function estimateTokens(str) {
  // GPT tokenizer generally splits on spaces and punctuation
  // A rough estimate is 4 characters per token
  return Math.ceil(str.length / 4);
}

// Helper function to calculate cost in USD
function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * 0.01; // $0.01 per 1K tokens
  const outputCost = (outputTokens / 1000) * 0.03; // $0.03 per 1K tokens
  return inputCost + outputCost;
}

// Create notification element
function createNotification(
  exists = true,
  isAuthenticated = false,
  tweetCount = 0
) {
  const notification = document.createElement("div");
  notification.className = "thread-extractor-notification hidden";

  // If blog exists but user is not authenticated, show both buttons
  if (exists && !isAuthenticated) {
    notification.innerHTML = `
    <div class="notification-content">
      <h2>🧵 Thread with ${tweetCount} tweets detected</h2>
      <p>There's a better way to read this.</p>
      <div class="notification-buttons">
        <button class="thread-extractor-button" id="viewThreadButton">
          Read better version
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px">
            <path d="M7 17L17 7"/>
            <path d="M7 7h10v10"/>
          </svg>
        </button>
        <button class="thread-extractor-button secondary" id="loginButton">
          Login for a better experience
        </button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
    `;
  } else if (exists) {
    notification.innerHTML = `
    <div class="notification-content">
      <h2>🧵 Thread with ${tweetCount} tweets detected</h2>
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
    `;
  } else if (!isAuthenticated) {
    // Blog doesn't exist and user is not authenticated
    notification.innerHTML = `
    <div class="notification-content">
      <h2>🧵 Thread with ${tweetCount} tweets detected</h2>
      <p>Simply login with X to get a better reading experience.</p>
      <div class="notification-buttons">
        <button class="thread-extractor-button" id="loginButton">
          Read better version
        </button>
      </div>
    </div>
    <button class="close-button" id="closeButton">×</button>
    `;
  } else {
    // Blog doesn't exist but user is authenticated
    notification.innerHTML = `
    <div class="notification-content">
      <h2>🧵 Thread with ${tweetCount} tweets detected</h2>
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
  }

  document.body.appendChild(notification);
  return notification;
}

// Show notification
async function showNotification(postId) {
  console.log("[Elongatd] Showing notification for post:", postId);

  // First check if we're on a tweet page
  if (!isTweetPage()) {
    console.log("[Elongatd] Not on a tweet page, ignoring show notification");
    return;
  }

  // Remove any existing notification
  removeNotification();

  try {
    // First ensure we have the latest auth status
    await initializeAuthStatus();

    // Then check blog existence
    const response = await makeAPIRequest(
      `/api/threads/${postId}/blogify/exists`,
      { credentials: "include" }
    );

    const blogExists = response.exists;
    const isDevelopment = !chrome.runtime.getManifest().update_url;
    console.log(
      "[Elongatd] Blog exists:",
      blogExists,
      "Is authenticated:",
      isDevelopment || authStatus
    );

    const notification = createNotification(
      blogExists,
      isDevelopment || authStatus, // Force true in development
      threadInfo.tweets.length
    );

    // Setup buttons based on state
    if (blogExists) {
      const viewButton = notification.querySelector("#viewThreadButton");
      const loginButton = notification.querySelector("#loginButton");
      const closeButton = notification.querySelector("#closeButton");

      viewButton.onclick = () => {
        window.open(
          `${window.extensionConfig.baseUrl}/post/${postId}`,
          "_blank"
        );
      };

      if (loginButton) {
        loginButton.onclick = () => {
          window.open(`${window.extensionConfig.authUrl}/login`, "_blank");
        };
      }

      closeButton.onclick = () => {
        notification.remove();
      };
    } else {
      const createButton = notification.querySelector("#create-and-view");
      const loginButton = notification.querySelector("#loginButton");
      const closeButton = notification.querySelector("#closeButton");

      if (createButton) {
        createButton.onclick = async () => {
          try {
            // Disable button and show loading state
            createButton.disabled = true;
            createButton.textContent = "Creating...";

            // First verify auth status
            const authResponse = await makeAPIRequest(`/api/auth/session`, {
              credentials: "include",
            });

            if (!authResponse?.user) {
              // If not authenticated, show login button
              createButton.textContent = "Please log in first";
              setTimeout(() => {
                window.open(
                  `${window.extensionConfig.authUrl}/login`,
                  "_blank"
                );
              }, 1000);
              return;
            }

            // Extract thread info and send directly to blogify endpoint
            const threadInfo = extractThreadInfoFromResponse(lastTweetDetail);
            const response = await makeAPIRequest(
              `/api/threads/${postId}/blogify`,
              {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(threadInfo),
              }
            );

            // Only open the blog post if we got a successful response with content
            if (response && response.content) {
              createButton.textContent = "Opening...";
              window.open(
                `${window.extensionConfig.baseUrl}/post/${postId}`,
                "_blank"
              );
            } else {
              throw new Error(
                "Failed to create blog post: No content returned"
              );
            }
          } catch (error) {
            console.error("[Elongatd] Error creating blog post:", error);
            // Reset button state and show error
            createButton.disabled = false;
            createButton.textContent = "Create readable version";
            // Show error message to user
            const notification = createButton.closest(".notification-content");
            if (notification) {
              const errorMessage = document.createElement("p");
              errorMessage.style.color = "red";
              errorMessage.textContent =
                error.message === "Please log in to elongatd.com first"
                  ? "Please log in first"
                  : "Failed to create blog post. Please try again.";
              notification.insertBefore(
                errorMessage,
                createButton.parentElement
              );
              // Remove error message after 3 seconds
              setTimeout(() => errorMessage.remove(), 3000);
            }
          }
        };
      }

      if (loginButton) {
        loginButton.onclick = () => {
          window.open(`${window.extensionConfig.authUrl}/login`, "_blank");
        };
      }

      closeButton.onclick = () => {
        notification.remove();
      };
    }

    // Show notification
    notification.classList.remove("hidden");
  } catch (error) {
    console.error("[Elongatd] Error processing tweet detail:", error);
  }
}

// Function to extract thread information from API response
function extractThreadInfoFromResponse(response) {
  try {
    const data =
      response.data.threaded_conversation_with_injections_v2.instructions[0];
    if (!data || !data.entries) {
      throw new Error("Invalid response structure");
    }

    const tweets = [];
    let authorInfo = null;

    // Find main tweet and thread entries
    const mainTweetEntry = data.entries.find((e) =>
      e.entryId.startsWith("tweet-")
    );
    const threadEntry = data.entries.find((e) =>
      e.entryId.startsWith("conversationthread-")
    );

    if (!mainTweetEntry) {
      throw new Error("Main tweet not found in response");
    }

    // Process main tweet
    const mainTweetContent =
      mainTweetEntry.content.itemContent.tweet_results.result;
    const mainTweetLegacy = mainTweetContent.legacy;
    const user = mainTweetContent.core.user_results.result.legacy;

    // Set author info from main tweet
    authorInfo = {
      id: mainTweetContent.core.user_results.result.rest_id,
      name: user.name,
      username: user.screen_name,
      profile_image_url: user.profile_image_url_https,
      verified:
        mainTweetContent.core.user_results.result.is_blue_verified || false,
      description: user.description || "",
      followers_count: user.followers_count || 0,
      following_count: user.friends_count || 0,
      location: user.location || "",
      created_at: user.created_at,
      url: user.url || "",
    };

    // Add main tweet
    const mainTweetText =
      mainTweetContent.note_tweet?.note_tweet_results?.result?.text ||
      mainTweetLegacy.full_text;
    tweets.push({
      id: mainTweetContent.rest_id,
      text: mainTweetText,
      created_at: mainTweetLegacy.created_at,
      metrics: {
        replies: mainTweetLegacy.reply_count,
        retweets: mainTweetLegacy.retweet_count,
        likes: mainTweetLegacy.favorite_count,
        views: mainTweetContent.views?.count || 0,
        bookmarks: mainTweetLegacy.bookmark_count || 0,
      },
      attachments: extractAttachments(mainTweetContent),
    });

    // Process thread replies if they exist
    if (threadEntry && threadEntry.content.items) {
      threadEntry.content.items.forEach((item) => {
        if (!item.item?.itemContent?.tweet_results?.result) return;
        const tweetContent = item.item.itemContent.tweet_results.result;

        // Only include tweets from the same author
        if (tweetContent.core.user_results.result.rest_id === authorInfo.id) {
          const replyText =
            tweetContent.note_tweet?.note_tweet_results?.result?.text ||
            tweetContent.legacy.full_text;
          tweets.push({
            id: tweetContent.rest_id,
            text: replyText,
            created_at: tweetContent.legacy.created_at,
            metrics: {
              replies: tweetContent.legacy.reply_count,
              retweets: tweetContent.legacy.retweet_count,
              likes: tweetContent.legacy.favorite_count,
              views: tweetContent.views?.count || 0,
              bookmarks: tweetContent.legacy.bookmark_count || 0,
            },
            attachments: extractAttachments(tweetContent),
          });
        }
      });
    }

    // Sort tweets by creation date
    tweets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const result = {
      author: authorInfo,
      thread_id: tweets[0].id,
      created_at: tweets[0].created_at,
      tweets: tweets,
      total_metrics: {
        replies: tweets.reduce((sum, t) => sum + t.metrics.replies, 0),
        retweets: tweets.reduce((sum, t) => sum + t.metrics.retweets, 0),
        likes: tweets.reduce((sum, t) => sum + t.metrics.likes, 0),
        views: tweets.reduce(
          (sum, t) => sum + (parseInt(t.metrics.views) || 0),
          0
        ),
        bookmarks: tweets.reduce((sum, t) => sum + t.metrics.bookmarks, 0),
      },
    };

    console.log("[Elongatd] Thread extracted successfully:", {
      id: result.thread_id,
      author: result.author.username,
      tweetCount: result.tweets.length,
    });
    return result;
  } catch (error) {
    console.error("[Elongatd] Error extracting thread info:", error);
    throw error;
  }
}

// Helper function to extract attachments
function extractAttachments(tweet) {
  const attachments = [];

  // Extract media (images and videos)
  if (tweet.legacy?.extended_entities?.media) {
    tweet.legacy.extended_entities.media.forEach((media) => {
      if (media.type === "photo") {
        attachments.push({
          type: "image",
          url: media.media_url_https,
          original_url: media.url,
        });
      } else if (media.type === "video") {
        // Filter to only MP4s and sort by bitrate
        const mp4Variants = media.video_info.variants.filter(
          (v) => v.content_type === "video/mp4"
        );

        // Sort by bitrate in descending order
        const sortedVariants = mp4Variants.sort((a, b) => {
          const bitrateA = a.bitrate || 0;
          const bitrateB = b.bitrate || 0;
          return bitrateB - bitrateA;
        });

        if (sortedVariants.length > 0) {
          const highestQuality = sortedVariants[0];
          attachments.push({
            type: "video",
            url: highestQuality.url,
            thumbnail_url: media.media_url_https,
            duration_ms: media.video_info.duration_millis,
            original_url: media.url,
            width: parseInt(
              highestQuality.url.match(/\/(\d+)x(\d+)\//)?.[1] || "0"
            ),
            height: parseInt(
              highestQuality.url.match(/\/(\d+)x(\d+)\//)?.[2] || "0"
            ),
            bitrate: highestQuality.bitrate,
          });
        }
      }
    });
  }

  // Extract card/link preview
  if (tweet.card?.legacy?.binding_values) {
    const values = tweet.card.legacy.binding_values.reduce(
      (acc, { key, value }) => {
        acc[key] = value.string_value;
        return acc;
      },
      {}
    );

    if (values.title || values.description) {
      attachments.push({
        type: "link",
        title: values.title,
        description: values.description,
        url: tweet.legacy.entities?.urls?.[0]?.expanded_url,
      });
    }
  }

  return attachments;
}

// Listen for tweet detail responses
document.addEventListener("tweet_detail_captured", async (event) => {
  console.log("[Elongatd] Tweet detail captured event received");
  try {
    // First check if we're on a tweet page
    if (!isTweetPage()) {
      console.log("[Elongatd] Not on a tweet page, ignoring event");
      return;
    }

    const data = event.detail.data;
    if (!data) return;

    // Extract tweet ID from the response
    const tweetResult =
      data.data?.threaded_conversation_with_injections_v2?.instructions?.[0]
        ?.entries?.[0]?.content?.itemContent?.tweet_results?.result;
    if (!tweetResult) return;

    const tweetId = tweetResult.rest_id;
    if (!tweetId) return;

    console.log("[Elongatd] Processing tweet:", tweetId);
    lastTweetDetail = data;

    // Extract thread info to check length
    const threadInfo = extractThreadInfoFromResponse(lastTweetDetail);
    if (threadInfo.tweets.length < 3) {
      console.log(
        "[Elongatd] Not enough tweets in thread:",
        threadInfo.tweets.length
      );
      return;
    }

    // First ensure we have the latest auth status
    await initializeAuthStatus();

    // Then check if blog exists
    const blogStatus = await makeAPIRequest(
      `/api/threads/${tweetId}/blogify/exists`,
      { credentials: "include" }
    );

    const blogExists = blogStatus.exists;

    // Create and show notification
    const isDevelopment = !chrome.runtime.getManifest().update_url;
    const notification = createNotification(
      blogExists,
      isDevelopment || authStatus, // Force true in development
      threadInfo.tweets.length
    );

    // Setup buttons based on state
    if (blogExists) {
      const viewButton = notification.querySelector("#viewThreadButton");
      const loginButton = notification.querySelector("#loginButton");
      const closeButton = notification.querySelector("#closeButton");

      viewButton.onclick = () => {
        window.open(
          `${window.extensionConfig.baseUrl}/post/${tweetId}`,
          "_blank"
        );
      };

      if (loginButton) {
        loginButton.onclick = () => {
          window.open(`${window.extensionConfig.authUrl}/login`, "_blank");
        };
      }

      closeButton.onclick = () => {
        notification.remove();
      };
    } else {
      const createButton = notification.querySelector("#create-and-view");
      const loginButton = notification.querySelector("#loginButton");
      const closeButton = notification.querySelector("#closeButton");

      if (createButton) {
        createButton.onclick = async () => {
          try {
            // Disable button and show loading state
            createButton.disabled = true;
            createButton.textContent = "Creating...";

            // First verify auth status
            const authResponse = await makeAPIRequest(`/api/auth/session`, {
              credentials: "include",
            });

            if (!authResponse?.user) {
              // If not authenticated, show login button
              createButton.textContent = "Please log in first";
              setTimeout(() => {
                window.open(
                  `${window.extensionConfig.authUrl}/login`,
                  "_blank"
                );
              }, 1000);
              return;
            }

            // Extract thread info and send directly to blogify endpoint
            const threadInfo = extractThreadInfoFromResponse(lastTweetDetail);
            const response = await makeAPIRequest(
              `/api/threads/${tweetId}/blogify`,
              {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(threadInfo),
              }
            );

            // Only open the blog post if we got a successful response with content
            if (response && response.content) {
              createButton.textContent = "Opening...";
              window.open(
                `${window.extensionConfig.baseUrl}/post/${tweetId}`,
                "_blank"
              );
            } else {
              throw new Error(
                "Failed to create blog post: No content returned"
              );
            }
          } catch (error) {
            console.error("[Elongatd] Error creating blog post:", error);
            // Reset button state and show error
            createButton.disabled = false;
            createButton.textContent = "Create readable version";
            // Show error message to user
            const notification = createButton.closest(".notification-content");
            if (notification) {
              const errorMessage = document.createElement("p");
              errorMessage.style.color = "red";
              errorMessage.textContent =
                error.message === "Please log in to elongatd.com first"
                  ? "Please log in first"
                  : "Failed to create blog post. Please try again.";
              notification.insertBefore(
                errorMessage,
                createButton.parentElement
              );
              // Remove error message after 3 seconds
              setTimeout(() => errorMessage.remove(), 3000);
            }
          }
        };
      }

      if (loginButton) {
        loginButton.onclick = () => {
          window.open(`${window.extensionConfig.authUrl}/login`, "_blank");
        };
      }

      closeButton.onclick = () => {
        notification.remove();
      };
    }

    // Show notification
    notification.classList.remove("hidden");
  } catch (error) {
    console.error("[Elongatd] Error processing tweet detail:", error);
  }
});

// Update the makeAPIRequest function to use direct storage access
async function makeAPIRequest(endpoint, options = {}) {
  try {
    const isDevelopment = !chrome.runtime.getManifest().update_url;
    const url = `${window.extensionConfig.authUrl}${endpoint}`;
    console.log("[Elongatd] Making API request:", {
      url,
      options: JSON.stringify(options, null, 2),
      isDevelopment,
      authStatus,
      authExpires,
    });

    // Get the current session if we don't have it
    let accessToken = null;
    if (endpoint !== "/api/auth/session") {
      const session = await makeAPIRequest("/api/auth/session", {
        credentials: "include",
      });
      accessToken = session?.accessToken;
      console.log("[Elongatd] Got access token for request:", accessToken);
    }

    // Prepare headers with access token if available
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      console.log(
        "[Elongatd] Added Authorization header:",
        headers.Authorization
      );
    }

    const finalOptions = {
      ...options,
      credentials: "include",
      headers,
      mode: "cors",
    };
    console.log(
      "[Elongatd] Final request options:",
      JSON.stringify(finalOptions, null, 2)
    );

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "API_REQUEST",
          url,
          options: finalOptions,
        },
        (response) => {
          console.log("[Elongatd] Background script response:", response);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });

    console.log("[Elongatd] API response:", response);

    if (response.user !== undefined) {
      const isAuthenticated = !!response.user;
      const expires = response.expires;
      console.log(
        "[Elongatd] Updating auth status:",
        isAuthenticated,
        "expires:",
        expires
      );
      authStatus = isAuthenticated;
      authExpires = expires;
      await chrome.storage.local.set({ authStatus, authExpires });
    }

    return response;
  } catch (error) {
    console.error("[Elongatd] API request error:", {
      error,
      message: error.message,
      stack: error.stack,
    });
    if (error.message?.includes("unauthorized")) {
      authStatus = false;
      authExpires = null;
      await chrome.storage.local.set({ authStatus: false, authExpires: null });
    }
    throw error;
  }
}
