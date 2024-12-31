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
    let mainTweet = null;

    // Process each entry
    data.entries.forEach((entry) => {
      if (!entry.content || !entry.content.itemContent) return;

      const tweetContent = entry.content.itemContent.tweet_results?.result;
      if (!tweetContent) return;

      const tweet = {
        id: tweetContent.rest_id,
        text: tweetContent.legacy.full_text,
        created_at: tweetContent.legacy.created_at,
        metrics: {
          replies: tweetContent.legacy.reply_count,
          retweets: tweetContent.legacy.retweet_count,
          likes: tweetContent.legacy.favorite_count,
          views: tweetContent.views?.count,
          bookmarks: tweetContent.legacy.bookmark_count,
        },
        user: {
          id: tweetContent.core.user_results.result.rest_id,
          name: tweetContent.core.user_results.result.legacy.name,
          username: tweetContent.core.user_results.result.legacy.screen_name,
          profile_image_url:
            tweetContent.core.user_results.result.legacy
              .profile_image_url_https,
        },
        attachments: [],
      };

      // Extract media attachments
      if (tweetContent.legacy.extended_entities?.media) {
        tweetContent.legacy.extended_entities.media.forEach((media) => {
          const attachment = {
            type: media.type,
            url: media.media_url_https,
          };

          if (media.type === "video") {
            attachment.video_info = {
              duration_millis: media.video_info.duration_millis,
              variants: media.video_info.variants,
            };
          }

          tweet.attachments.push(attachment);
        });
      }

      // If this is the first tweet, it's the main tweet
      if (!mainTweet) {
        mainTweet = tweet;
      } else {
        tweets.push(tweet);
      }
    });

    const result = {
      mainTweet,
      replies: tweets,
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
