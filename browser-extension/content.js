// Cross-browser runtime API
const runtime = typeof browser !== "undefined" ? browser : chrome;

console.log("Content script loaded");

// Function to extract thread information
function extractThreadInfo() {
  console.log("Starting thread extraction...");

  const threadInfo = {
    mainTweet: {},
    replies: [],
  };

  // Debug the DOM structure
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  console.log("Found primary column:", !!primaryColumn);

  const timeline = primaryColumn?.querySelector(
    '[aria-label="Timeline: Conversation"]'
  );
  console.log("Found timeline:", !!timeline);

  // Get all tweet articles directly
  const tweetArticles = document.querySelectorAll(
    'article[data-testid="tweet"]'
  );
  console.log("Found tweet articles:", tweetArticles.length);
  console.log("Tweet articles parent structure:");
  tweetArticles.forEach((article, index) => {
    let parent = article.parentElement;
    let path = ["article"];
    let depth = 0;
    while (parent && depth < 5) {
      path.push(
        parent.tagName.toLowerCase() +
          (parent.id ? `#${parent.id}` : "") +
          (parent.className ? `.${parent.className}` : "") +
          (parent.getAttribute("data-testid")
            ? `[data-testid="${parent.getAttribute("data-testid")}"]`
            : "")
      );
      parent = parent.parentElement;
      depth++;
    }
    console.log(`Article ${index + 1} path:`, path.join(" > "));
  });

  if (!tweetArticles || tweetArticles.length === 0) {
    throw new Error(
      "Could not find any tweets. Make sure you are on a tweet page."
    );
  }

  // Process each tweet article
  let foundMainTweet = false;
  tweetArticles.forEach((article, index) => {
    console.log(
      `Processing tweet article ${index + 1}/${tweetArticles.length}`
    );

    const tweetInfo = extractTweetInfo(article);
    if (!tweetInfo) {
      console.log(`- Failed to extract info from tweet article ${index + 1}`);
      return;
    }
    console.log(`- Successfully extracted tweet info:`, tweetInfo);

    // The first valid tweet we find is the main tweet
    if (!foundMainTweet) {
      console.log("- Setting as main tweet");
      threadInfo.mainTweet = tweetInfo;
      foundMainTweet = true;
    } else if (tweetInfo.username === threadInfo.mainTweet.username) {
      console.log("- Adding as reply (same username)");
      threadInfo.replies.push(tweetInfo);
    } else {
      console.log(
        `- Skipping tweet (different username: ${tweetInfo.username} vs ${threadInfo.mainTweet.username})`
      );
    }
  });

  if (!foundMainTweet) {
    throw new Error("Failed to extract main tweet information");
  }

  // Sort replies by timestamp
  threadInfo.replies.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  console.log("Final thread info:", threadInfo);
  return threadInfo;
}

// Function to extract information from a single tweet
function extractTweetInfo(article) {
  try {
    console.log("Extracting tweet info...");

    // Debug the article structure
    console.log("Article HTML:", article.outerHTML);

    // Get username (now handling the full User-Name element structure)
    const userNameElement = article.querySelector('[data-testid="User-Name"]');
    console.log("- Found User-Name element:", !!userNameElement);
    if (userNameElement) {
      console.log("- User-Name element HTML:", userNameElement.outerHTML);
    }

    let username = "";
    if (userNameElement) {
      // Try different selectors for username
      const selectors = [
        'div[dir="ltr"] > span',
        'a[role="link"] span',
        'a[href^="/"]:not([href*="/status/"]) span',
        'div[dir="ltr"]:first-child',
      ];

      for (const selector of selectors) {
        const element = userNameElement.querySelector(selector);
        if (element) {
          username = element.textContent.trim();
          console.log(
            `- Found username using selector "${selector}":`,
            username
          );
          break;
        }
      }
    }
    if (!username) {
      console.warn("Could not extract username");
    }

    // Get timestamp
    const timeElement = article.querySelector("time");
    const timestamp = timeElement ? timeElement.getAttribute("datetime") : "";
    console.log("- Found timestamp:", timestamp);

    if (!timestamp) {
      console.warn("Could not extract timestamp");
    }

    // Get tweet text
    const tweetTextElement = article.querySelector('[data-testid="tweetText"]');
    const tweetText = tweetTextElement ? tweetTextElement.textContent : "";
    console.log("- Found tweet text:", !!tweetText);

    if (!tweetText) {
      console.warn("Could not extract tweet text");
    }

    // Get metrics
    const metrics = {
      replies: getMetricCount(article, "reply"),
      retweets: getMetricCount(article, "retweet"),
      likes: getMetricCount(article, "like"),
    };
    console.log("- Found metrics:", metrics);

    const tweetInfo = {
      username,
      timestamp,
      text: tweetText,
      metrics,
    };
    console.log("Successfully extracted tweet info:", tweetInfo);
    return tweetInfo;
  } catch (error) {
    console.error("Error extracting tweet info:", error);
    return null;
  }
}

// Helper function to get metric counts
function getMetricCount(article, metric) {
  const metricElement = article.querySelector(`[data-testid="${metric}"]`);
  if (!metricElement) {
    console.warn(`Could not find ${metric} count`);
    return 0;
  }

  const countText = metricElement.textContent;
  const count = parseInt(countText.replace(/[^0-9]/g, "")) || 0;
  return count;
}

// Function to send data to our API
async function sendToApi(threadInfo, postId) {
  try {
    console.log("Sending data to API:", {
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
    console.log("API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending data to API:", error);
    throw error;
  }
}

// Listen for messages from the popup
runtime.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  if (request.action === "extractThread") {
    try {
      const threadInfo = extractThreadInfo();
      console.log("Extracted thread info:", threadInfo);

      // Extract post ID from URL
      const postId = window.location.pathname.split("/status/")[1];
      if (!postId) {
        throw new Error("Could not extract post ID from URL");
      }

      // Send to our API
      sendToApi(threadInfo, postId)
        .then((response) => {
          console.log("Sending success response:", {
            success: true,
            data: threadInfo,
            response,
          });
          sendResponse({ success: true, data: threadInfo, response });
        })
        .catch((error) => {
          console.error("Sending error response:", error);
          sendResponse({ success: false, error: error.message });
        });

      return true; // Required for async sendResponse
    } catch (error) {
      console.error("Error in content script:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
});
