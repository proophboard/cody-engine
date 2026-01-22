import {injectMockApi} from "./inject-mock-api.js";

type HandlerInfo = {
  tabId: number;
  origin: string; // e.g., "https://vibe-cody.ai"
};

type RequestMessage = {
  url: string,
  method: 'GET' | 'POST',
  headers?: HeadersInit,
  body?: BodyInit | null,
}

console.log("[VibeCodyExtension] register service worker");

chrome.runtime.onStartup.addListener(async () => {
  const handlers = await getHandlers();
  await updateIcon(handlers);
});

chrome.runtime.onInstalled.addListener(async () => {
  await setHandlers(new Map());
});


// Handle messages from content script and injected page scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[VibeCodyExtension] Service worker received message:", msg);

  // Handle Mock API Messages
  if(msg.type) {
    const origin = msg.origin;

    switch (msg.type) {
      case "VIBE_CODY_REGISTER_API_HANDLER": {
        if (!sender.tab?.id) {
          console.warn("[VibeCodyExtension] No valid tab ID available to register api mock handler!");
          return;
        }

        const tabId = sender.tab.id!;

        getHandlers().then(async (handlers) => {
          handlers.set(origin, { tabId, origin });
          await setHandlers(handlers);
          await updateIcon(handlers);
          console.log("[VibeCodyExtension] Registered handler for", origin);
          sendResponse({ status: "ok" });
        })
        return;
      }

      case "VIBE_CODY_UNREGISTER_API_HANDLER": {
        getHandlers().then(async (handlers) => {
          handlers.delete(origin);
          await setHandlers(handlers);
          await updateIcon(handlers);
          console.log("[VibeCodyExtension] Unregistered api handler for", msg.origin);
          sendResponse({ status: "ok" });
        })

        return;
      }

      case "vibe-cody-sw-get-registered-handlers": {
        // Respond with the origins of all currently registered handlers
        getHandlers().then(handlers => {
          sendResponse(Array.from(handlers.keys()));
        })

        return true;
      }
    }
  }

  if (msg.action === "vibe-cody-sw-inject-page-script") {
    if (typeof sender.tab?.id !== "number" || typeof sender.frameId !== "number") {
      console.warn("[VibeCodyExtension] No valid tab and/or frame ID available as a target to inject the page script!", sender);
      return;
    }

    console.log("[VibeCodyExtension] injecting page interceptor");

    chrome.scripting.executeScript({
      target: { frameIds: [sender.frameId], tabId: sender.tab.id },
      world: "MAIN",
      func: injectMockApi,
    }).catch((error) => {
      console.error("[VibeCodyExtension] Failed to inject script:", error);
    });

    return;
  }

  // Handle intercepted api requests from injected page script
  if (msg.action === "vibe-cody-sw-handle-app-request") {
    console.log("[VibeCodyExtension] Handling intercepted request:", msg.request.url, msg.requestId);

    const fullUrl = "https://vibe-cody.ai/api-mock" + msg.request.url;

    // Handle async response
    (async () => {
      try {
        const handlers = await getHandlers();

        if(handlers.size === 0) {
          sendResponse({
            success: true,
            requestId: msg.requestId,
            data: {
              "error": "No API Handler registered to serve the request. Please check the Vibe Cody Extension and reload the Cody Play backend!"
            },
            status: 503,
            statusText: "Service Unavailable"
          })
          return;
        }

        // Forward request to first active handler tab
        const firstHandler = handlers.values().next().value as HandlerInfo;

        console.log(`[VibeCodyExtension] Forwarding request ${fullUrl} to handler: ${firstHandler.origin}`);

        chrome.tabs.sendMessage(
          firstHandler.tabId,
          {
            type: "VIBE_CODY_API_REQUEST",
            requestId: msg.requestId,
            request: {
              ...msg.request,
              url: fullUrl,
            } as RequestMessage
          },
          (response) => {
            console.log("[VibeCodyExtension] Received response data:", response);
            sendResponse({
              success: true,
              ...response
            });
          }
        )
      } catch (error) {
        console.error("[VibeCodyExtension] Error handling mock api request:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    })().catch(e => console.error(e));

    return true; // Keep message channel open for async response
  }
});

async function updateIcon(handlers: Map<string, HandlerInfo>) {
  if(handlers.size > 0) {
    await chrome.action.setIcon({
      path: {
        16: "icon/cody_active_16.png",
        32: "icon/cody_active_32.png"
      }
    });
  } else {
    await chrome.action.setIcon({
      path: {
        16: "icon/cody_light_16.png",
        32: "icon/cody_light_32.png"
      }
    });
  }
}

// service-worker.ts
async function setHandlers(handlers: Map<string, HandlerInfo>) {
  await chrome.storage.local.set({ handlers: Array.from(handlers.values()) });
}

async function getHandlers(): Promise<Map<string, HandlerInfo>> {
  const result = await chrome.storage.local.get('handlers') as {handlers: HandlerInfo[]};

  const handlers = result?.handlers ?? [];

  const handlersMap: Map<string, HandlerInfo> = new Map();

  handlers.forEach(h => {
    handlersMap.set(h.origin, h);
  })

  return handlersMap;
}
