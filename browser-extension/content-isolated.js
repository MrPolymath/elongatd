console.log("[Thread Extractor] Isolated world script loaded");

// Store config and last tweet detail
let config = null;
let lastTweetDetail = null;

// Helper function to extract attachments from a tweet
function extractAttachments(tweet) {
  const attachments = [];

  // Extract media (images and videos)
  if (tweet.legacy?.extended_entities?.media) {
    tweet.legacy.extended_entities.media.forEach((media) => {
      if (media.type === "photo") {
        attachments.push({
          type: "image",
          url: media.media_url_https,
          width: media.original_info.width,
          height: media.original_info.height,
        });
      } else if (media.type === "video" || media.type === "animated_gif") {
        const variant = media.video_info.variants
          .filter((v) => v.content_type === "video/mp4")
          .sort((a, b) => b.bitrate - a.bitrate)[0];

        attachments.push({
          type: "video",
          url: variant.url,
          thumbnail_url: media.media_url_https,
          duration_ms: media.video_info.duration_millis,
          width: media.original_info.width,
          height: media.original_info.height,
          bitrate: variant.bitrate,
        });
      }
    });
  }

  // Extract card (links)
  if (tweet.card?.legacy) {
    const card = tweet.card.legacy;
    if (card.name === "summary" || card.name === "summary_large_image") {
      attachments.push({
        type: "link",
        url: card.binding_values.card_url?.string_value || "",
        title: card.binding_values.title?.string_value || "",
        description: card.binding_values.description?.string_value || "",
      });
    }
  }

  return attachments;
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

    return {
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
  } catch (error) {
    console.error("[Thread Extractor] Error extracting thread info:", error);
    throw error;
  }
}

// Helper function to make API requests through background script
async function makeAPIRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
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
}

// Check if thread exists and show notification
async function checkThreadAndNotify(postId) {
  if (!config) {
    console.error("[Thread Extractor] Config not initialized");
    return;
  }

  try {
    // Check if thread exists in our system
    const existsData = await makeAPIRequest(
      `${config.apiBaseUrl}/${postId}/exists`
    );

    if (existsData.exists) {
      try {
        // Check if blog version exists
        const blogData = await makeAPIRequest(
          `${config.apiBaseUrl}/${postId}/blogify`
        );
        window.postMessage(
          {
            type: "SHOW_NOTIFICATION",
            postId,
            exists: true,
            hasBlog: !blogData.error,
          },
          window.location.origin
        );
      } catch (error) {
        // If blogify fails, still show the thread notification
        window.postMessage(
          {
            type: "SHOW_NOTIFICATION",
            postId,
            exists: true,
            hasBlog: false,
          },
          window.location.origin
        );
      }
    } else {
      // Show notification for new thread
      window.postMessage(
        {
          type: "SHOW_NOTIFICATION",
          postId,
          exists: false,
          hasBlog: false,
        },
        window.location.origin
      );
    }
  } catch (error) {
    console.error("[Thread Extractor] Error checking thread:", error);
  }
}

// Function to create and view thread
async function createAndViewThread(postId) {
  try {
    // Extract thread data from the page
    const threadData = extractThreadInfoFromResponse(lastTweetDetail);

    // Send to our API
    await makeAPIRequest(`${config.apiBaseUrl}/${postId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threadData),
    });

    // Redirect to the thread view
    const baseUrl = config.apiBaseUrl.replace("/api/threads", "");
    window.location.href = `${baseUrl}/post/${postId}?view=thread`;
  } catch (error) {
    console.error("[Thread Extractor] Error creating thread:", error);
  }
}

// Listen for messages from the main world
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "CONFIG_UPDATE") {
    config = event.data.config;
    console.log("[Thread Extractor] Received config:", config);
  }

  if (event.data.type === "TWEET_DETAIL_CAPTURED") {
    console.log("[Thread Extractor] Tweet detail captured:", event.data);
    lastTweetDetail = event.data.data;

    // Get post ID from URL
    const postId = window.location.pathname.split("/status/")[1]?.split("/")[0];
    if (postId) {
      checkThreadAndNotify(postId);
    }
  }

  if (event.data.type === "CREATE_AND_VIEW_THREAD") {
    const { postId } = event.data;
    createAndViewThread(postId);
  }
});
