// @ts-nocheck

export const injectMockApi = () => {
  if (window.__mockAPIInjected) return;
  window.__mockAPIInjected = true;

  console.log("[VibeCodyExtension] Page interceptor injected into: ", window.location.href);

  // Generate unique request IDs
  let requestIdCounter = 0;
  const pendingRequests = new Map();

  // Listen for responses from content script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== "VIBE_CODY_APP_RESPONSE") return;

    console.log("[VibeCodyExtension] Received response for requestId:", event.data.requestId, event.data);

    const pending = pendingRequests.get(event.data.requestId);
    if (pending) {
      if (event.data.success) {
        pending.resolve(new Response(JSON.stringify(event.data.response.data), {
          status: event.data.response.status || 200,
          statusText: event.data.response.statusText || "OK",
          headers: { "Content-Type": "application/json" }
        }));
      } else {
        pending.reject(new Error(event.data.error || "Request failed"));
      }
      pendingRequests.delete(event.data.requestId);
    }
  });

  // Intercept fetch requests
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0].url;

    if (url.startsWith("https://vibe-cody.ai/api-mock/")) {
      const path = url.replace("https://vibe-cody.ai/api-mock", "");
      const options = args[1] || {};

      console.log("[VibeCodyExtension] Sending to content script:", path);

      // Send request via postMessage to content script
      return new Promise((resolve, reject) => {
        const requestId = ++requestIdCounter;
        pendingRequests.set(requestId, { resolve, reject });

        window.postMessage({
          type: "VIBE_CODY_APP_REQUEST",
          requestId,
          request: {
            method: options.method || "GET",
            url: path,
            headers: options.headers || {},
            body: options.body
          }
        }, "*");

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error("Request timeout"));
          }
        }, 30000);
      });
    }
    return originalFetch(...args);
  };

  // Intercept XMLHttpRequest - simplified to use fetch
  const OriginalXHR = window.XMLHttpRequest;
  class MockXHR extends OriginalXHR {
    private _url: string = "";
    private _method: string = "GET";
    private _async: boolean = true;
    private _requestHeaders: Record<string, string> = {};

    open(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
      this._url = url;
      this._method = method;
      this._async = async ?? true;

      if (!url.startsWith("https://vibe-cody.ai/api-mock/")) {
        return super.open(method, url, this._async, user ?? null, password ?? null);
      }

      // Don't call super.open for mock URLs
      return;
    }

    setRequestHeader(name: string, value: string) {
      if (this._url.startsWith("https://vibe-cody.ai/api-mock/")) {
        this._requestHeaders[name] = value;
      } else {
        super.setRequestHeader(name, value);
      }
    }

    send(body?: Document | XMLHttpRequestBodyInit | null) {
      if (this._url.startsWith("https://vibe-cody.ai/api-mock/")) {
        // Use our fetch interception

        window.fetch(this._url, {
          method: this._method,
          headers: this._requestHeaders,
          body: body as BodyInit
        }).then(response => response.text()).then(text => {
          Object.defineProperty(this, 'responseText', { value: text, writable: false });
          Object.defineProperty(this, 'status', { value: 200, writable: false });
          Object.defineProperty(this, 'readyState', { value: 4, writable: false });
          this.onreadystatechange?.(new Event('readystatechange'));
          this.onload?.(new ProgressEvent('load'));
        }).catch(error => {
          this.onerror?.(new ProgressEvent('error'));
        });
      } else {
        super.send(body);
      }
    }
  }
  window.XMLHttpRequest = MockXHR;
}
