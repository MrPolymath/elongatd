// Store the last TweetDetail response
let lastTweetDetail = null;

console.log("[Thread Extractor] Content script loaded");

// Listen for the tweet detail event
window.addEventListener("tweet_detail_captured", function (event) {
  console.log("[Thread Extractor] Tweet detail captured:", event.detail.data);
  lastTweetDetail = event.detail.data;
});

// Function to extract thread information from API response
function extractThreadInfoFromResponse(response) {
  console.log(
    "[Thread Extractor] Extracting thread info from response:",
    response
  );
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
      verified: user.verified || user.is_blue_verified || false,
      description: user.description || "",
      followers_count: user.followers_count || 0,
      following_count: user.friends_count || 0,
      location: user.location || "",
      created_at: user.created_at,
      url: user.url || "",
    };

    // Add main tweet
    tweets.push(extractTweetInfo(mainTweetContent));

    // Process thread replies if they exist
    if (threadEntry && threadEntry.content.items) {
      threadEntry.content.items.forEach((item) => {
        if (!item.item?.itemContent?.tweet_results?.result) return;
        const tweetContent = item.item.itemContent.tweet_results.result;

        // Only include tweets from the same author
        if (tweetContent.core.user_results.result.rest_id === authorInfo.id) {
          tweets.push(extractTweetInfo(tweetContent));
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

    console.log(
      "[Thread Extractor] Successfully extracted thread info:",
      result
    );
    return result;
  } catch (error) {
    console.error("[Thread Extractor] Error extracting thread info:", error);
    throw error;
  }
}

// Helper function to extract tweet information
function extractTweetInfo(tweetContent) {
  const legacy = tweetContent.legacy;

  const tweet = {
    id: tweetContent.rest_id,
    text: legacy.full_text,
    created_at: legacy.created_at,
    metrics: {
      replies: legacy.reply_count,
      retweets: legacy.retweet_count,
      likes: legacy.favorite_count,
      views: tweetContent.views?.count || 0,
      bookmarks: legacy.bookmark_count || 0,
    },
    attachments: [],
  };

  // Extract media attachments
  if (legacy.extended_entities?.media) {
    legacy.extended_entities.media.forEach((media) => {
      const attachment = {
        type: media.type,
        url: media.media_url_https,
      };

      if (media.type === "video") {
        attachment.video_info = {
          duration_millis: media.video_info.duration_millis,
          variants: media.video_info.variants.map((v) => ({
            bitrate: v.bitrate,
            content_type: v.content_type,
            url: v.url,
          })),
        };
      }

      tweet.attachments.push(attachment);
    });
  }

  return tweet;
}

// Function to send data to our API
async function sendToApi(threadInfo, postId) {
  try {
    console.log("[Thread Extractor] Sending data to API:", {
      url: `${window.config.apiBaseUrl}/${postId}`,
      data: threadInfo,
    });

    const response = await fetch(`${window.config.apiBaseUrl}/${postId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threadInfo),
    });

    const result = await response.json();
    console.log("[Thread Extractor] API response:", result);
    return result;
  } catch (error) {
    console.error("[Thread Extractor] Error sending data to API:", error);
    throw error;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Thread Extractor] Received message:", request);

  if (request.action === "extractThread") {
    // Get the post ID from the URL
    const postId = window.location.pathname.split("/status/")[1];
    if (!postId) {
      console.error("[Thread Extractor] Could not extract post ID from URL");
      sendResponse({
        success: false,
        error: "Could not extract post ID from URL",
      });
      return true;
    }

    if (!lastTweetDetail) {
      console.error("[Thread Extractor] No tweet data available");
      sendResponse({
        success: false,
        error:
          "No tweet data available. Please refresh the page and try again.",
      });
      return true;
    }

    try {
      console.log(
        "[Thread Extractor] Processing captured tweet data:",
        lastTweetDetail
      );
      const threadInfo = extractThreadInfoFromResponse(lastTweetDetail);

      // Send to our API
      sendToApi(threadInfo, postId)
        .then((result) => {
          console.log("[Thread Extractor] Successfully processed thread");
          sendResponse({
            success: true,
            message: "Thread data processed successfully",
          });
        })
        .catch((error) => {
          console.error("[Thread Extractor] Error processing thread:", error);
          sendResponse({ success: false, error: error.message });
        });
    } catch (error) {
      console.error("[Thread Extractor] Error processing thread:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }
});
