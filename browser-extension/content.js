console.log("[Elongatd] Content script (Isolated) loaded");

// Store the last TweetDetail response and auth status
let lastTweetDetail = null;
let notificationTimeout = null;
let authStatus = null;

// Initialize auth status from storage
chrome.storage.local.get(["authStatus"], (result) => {
  console.log("[Elongatd] Loaded auth status:", result.authStatus);
  authStatus = result.authStatus;
});

// Helper function to make API requests through background script
async function makeAPIRequest(url, options = {}) {
  try {
    console.log("[Elongatd] Making API request:", url);
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "API_REQUEST", url, options },
        (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });

    console.log("[Elongatd] API response:", response);

    // If the response includes auth information, update the stored auth status
    if (response.isAuthenticated !== undefined) {
      console.log("[Elongatd] Updating auth status:", response.isAuthenticated);
      authStatus = response.isAuthenticated;
      chrome.storage.local.set({ authStatus });
    }

    return response;
  } catch (error) {
    console.error("[Elongatd] API request error:", error);
    // If we get an auth error, clear the stored auth status
    if (error.message?.includes("unauthorized")) {
      authStatus = false;
      chrome.storage.local.set({ authStatus: false });
    }
    throw error;
  }
}

// Create notification element
function createNotification(exists = true, isAuthenticated = false) {
  const notification = document.createElement("div");
  notification.className = "thread-extractor-notification hidden";

  // If blog exists but user is not authenticated, show both buttons
  if (exists && !isAuthenticated) {
    notification.innerHTML = `
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
    `;
  } else {
    notification.innerHTML = `
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
  }

  document.body.appendChild(notification);
  return notification;
}

// Show notification
async function showNotification(postId) {
  console.log("[Elongatd] Showing notification for post:", postId);
  // Remove any existing notification
  const existingNotification = document.querySelector(
    ".thread-extractor-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  try {
    // Single API call that returns both blog existence and auth status
    const response = await makeAPIRequest(
      `https://www.elongatd.com/api/threads/${postId}/blogify/exists`,
      { credentials: "include" }
    );

    const { exists: blogExists, isAuthenticated } = response;
    console.log(
      "[Elongatd] Blog exists:",
      blogExists,
      "Is authenticated:",
      isAuthenticated
    );

    const notification = createNotification(blogExists, isAuthenticated);

    // Setup buttons based on state
    if (blogExists) {
      const viewButton = notification.querySelector("#viewThreadButton");
      const loginButton = notification.querySelector("#loginButton");
      const closeButton = notification.querySelector("#closeButton");

      viewButton.onclick = () => {
        window.open(`https://www.elongatd.com/post/${postId}`, "_blank");
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
      const closeButton = notification.querySelector("#closeButton");

      createButton.onclick = async () => {
        try {
          // Disable button and show loading state
          createButton.disabled = true;
          createButton.textContent = "Opening...";

          // Extract thread info and send to API
          const threadInfo = extractThreadInfoFromResponse(lastTweetDetail);
          await makeAPIRequest(
            `https://www.elongatd.com/api/threads/${postId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(threadInfo),
            }
          );

          // Open the thread page
          window.open(`https://www.elongatd.com/post/${postId}`, "_blank");
        } catch (error) {
          console.error("[Elongatd] Error creating thread:", error);
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
  } catch (error) {
    console.error("[Elongatd] Error checking status:", error);
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

    // First check if blog exists
    const blogStatus = await makeAPIRequest(
      `${window.extensionConfig.apiBaseUrl}/${tweetId}/blogify/exists`,
      { credentials: "include" }
    );

    const { exists: blogExists, isAuthenticated } = blogStatus;

    // If blog doesn't exist, store the thread data
    if (!blogExists) {
      const threadInfo = extractThreadInfoFromResponse(data);
      await makeAPIRequest(`${window.extensionConfig.apiBaseUrl}/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(threadInfo),
      });
    }

    // Create and show notification
    const notification = createNotification(blogExists, isAuthenticated);

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
      const closeButton = notification.querySelector("#closeButton");

      createButton.onclick = async () => {
        try {
          // Disable button and show loading state
          createButton.disabled = true;
          createButton.textContent = "Opening...";

          // Open the thread page
          window.open(
            `${window.extensionConfig.baseUrl}/post/${tweetId}`,
            "_blank"
          );
        } catch (error) {
          console.error("[Elongatd] Error creating thread:", error);
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
  } catch (error) {
    console.error("[Elongatd] Error processing tweet detail:", error);
  }
});
