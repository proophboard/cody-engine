console.log("[VibeCodyExtension] content script loaded on: ", window.location.href);

const pendingApiRequests = new Map();

// Bridge between page context and extension service worker
window.addEventListener("message", (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  if(event.data?.type === "VIBE_CODY_REGISTER_API_HANDLER") {
    chrome.runtime.sendMessage(event.data);
  }

  if(event.data?.type === "VIBE_CODY_UNREGISTER_API_HANDLER") {
    chrome.runtime.sendMessage(event.data);
  }

  // Handle intercepted requests from the UI, see src/service-worker.ts for request interception
  if (event.data?.type === "VIBE_CODY_APP_REQUEST") {
    console.log("[VibeCodyExtension] Forwarding request to service worker, requestId:", event.data.requestId);

    chrome.runtime.sendMessage(
      {
        action: "vibe-cody-sw-handle-app-request",
        request: event.data.request,
        requestId: event.data.requestId,
      },
      (response) => {
        // Check for errors
        if (chrome.runtime.lastError) {
          console.error("[VibeCodyExtension] Error from service worker:", chrome.runtime.lastError, response);
          window.postMessage({
            type: "VIBE_CODY_APP_RESPONSE",
            requestId: event.data.requestId,
            success: false,
            error: chrome.runtime.lastError.message
          }, "*");
          return;
        }

        console.log("[VibeCodyExtension] Received response from service worker, sending back to page", response);

        // Send response back to page
        window.postMessage({
          ...response,
          type: "VIBE_CODY_APP_RESPONSE",
        }, "*");
      }
    );
  }

  // Forwarding API Response from Handler to Service Worker
  if (event.data?.type === "VIBE_CODY_API_RESPONSE") {
    console.log("[VibeCodyExtension] Forwarding API response to service worker, requestId:", event.data.requestId);

    const pending = pendingApiRequests.get(event.data.requestId);

    if(pending) {
      pending(event.data);
    } else {
      console.error("[VibeCodyExtension] No pending api request found in the registry. Ignoring the response.");
    }
  }
});

// Forwarding API request from service worker to handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(!msg.type) return;

  if(msg.type === "VIBE_CODY_API_REQUEST") {
    pendingApiRequests.set(msg.requestId, sendResponse);

    window.postMessage(msg, '*');
  }

  return true;  // Keep message channel open for async response
})

// Request injection of page script
chrome.runtime.sendMessage({ action: "vibe-cody-sw-inject-page-script" });


