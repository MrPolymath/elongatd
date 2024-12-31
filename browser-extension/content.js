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
    console.log("[Thread Extractor] Main tweet text:", mainTweetText);
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
          console.log("[Thread Extractor] Reply tweet text:", replyText);
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

  // Get text from note_tweet_results
  const text = tweetContent.note_tweet?.note_tweet_results?.result?.text || "";
  if (!text) {
    console.error("[Thread Extractor] No text found in tweet:", tweetContent);
    throw new Error("No text found in tweet");
  }

  const tweet = {
    id: tweetContent.rest_id,
    text: text,
    created_at: legacy.created_at,
    metrics: {
      replies: legacy.reply_count,
      retweets: legacy.retweet_count,
      likes: legacy.favorite_count,
      views: tweetContent.views?.count || 0,
      bookmarks: legacy.bookmark_count || 0,
    },
    attachments: extractAttachments(tweetContent),
  };

  console.log("[Thread Extractor] Extracted tweet:", {
    id: tweet.id,
    text: tweet.text,
  });
  return tweet;
}

function extractAttachments(tweet) {
  console.log("[Thread Extractor] Extracting attachments from tweet:", {
    hasExtendedEntities: !!tweet.legacy?.extended_entities,
    hasCard: !!tweet.card,
    tweetData: tweet,
  });

  const attachments = [];

  // Extract media (images and videos)
  if (tweet.legacy?.extended_entities?.media) {
    console.log(
      "[Thread Extractor] Found media attachments:",
      tweet.legacy.extended_entities.media
    );
    tweet.legacy.extended_entities.media.forEach((media) => {
      if (media.type === "photo") {
        console.log("[Thread Extractor] Processing photo:", media);
        attachments.push({
          type: "image",
          url: media.media_url_https,
          original_url: media.url,
        });
      } else if (media.type === "video") {
        console.log("[Thread Extractor] Processing video:", media);
        // Filter to only MP4s and sort by bitrate
        const mp4Variants = media.video_info.variants.filter(
          (v) => v.content_type === "video/mp4"
        );

        console.log(
          "[Thread Extractor] MP4 variants before sorting:",
          mp4Variants
        );

        // Sort by bitrate in descending order
        const sortedVariants = mp4Variants.sort((a, b) => {
          const bitrateA = a.bitrate || 0;
          const bitrateB = b.bitrate || 0;
          return bitrateB - bitrateA;
        });

        console.log("[Thread Extractor] Sorted variants:", sortedVariants);

        if (sortedVariants.length > 0) {
          const highestQuality = sortedVariants[0];
          console.log(
            "[Thread Extractor] Selected highest quality variant:",
            highestQuality
          );

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
    console.log(
      "[Thread Extractor] Found card:",
      tweet.card.legacy.binding_values
    );
    const values = tweet.card.legacy.binding_values.reduce(
      (acc, { key, value }) => {
        acc[key] = value.string_value;
        return acc;
      },
      {}
    );

    if (values.title || values.description) {
      console.log("[Thread Extractor] Adding link attachment:", values);
      attachments.push({
        type: "link",
        title: values.title,
        description: values.description,
        url: tweet.legacy.entities?.urls?.[0]?.expanded_url,
      });
    }
  }

  console.log("[Thread Extractor] Final attachments:", attachments);
  return attachments;
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
