import {useContext, useEffect} from "react";
import {getConfiguredPlayMessageBox} from "@cody-play/infrastructure/message-box/configured-message-box";
import {configStore} from "@cody-play/state/config-store";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import {handleMockApiRequest} from "@cody-play/infrastructure/mock-api/mock-api-handler";
import {ValidationError} from "ajv";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import util from "node:util";

type RequestMessage = {
  url: string,
  method: 'GET' | 'POST',
  headers?: HeadersInit,
  body?: BodyInit | null,
}

type MockRequest = {
  type: "VIBE_CODY_API_REQUEST",
  requestId: string,
  request: RequestMessage,
}

/**
 * The Cody Play runtime registers itself as a Mock API Handler
 * in the Vibe Cody Extension (see package: vc-extension)
 *
 * The Vibe Cody Extension injects a content script that listens on
 * window messages and forwards them to a service worker running in the extension.
 *
 * The service worker asks registered handlers to provide a response for a request.
 *
 * The content script acts as a proxy in both directions so.
 */
export function useMockApiHandler() {
  const {config, dispatch} = useContext(configStore);
  const msgBox = getConfiguredPlayMessageBox(config);
  const auth = getConfiguredPlayAuthService();

  useEffect(() => {
    const origin = window.location.origin;

    console.log("[CodyPlay] Registering mock api handler");

    window.postMessage(
      { type: "VIBE_CODY_REGISTER_API_HANDLER", origin },
      '*'
    );

    const messageListener = async (event: MessageEvent<MockRequest>) => {
      // Only accept messages from same window
      if (event.source !== window) return;

      if (event.data?.type === "VIBE_CODY_API_REQUEST") {

        console.log("[VibeCodyAPI] Received api request from extension: ", event.data);

        const request = new Request(event.data.request.url, {
          method: event.data.request.method,
          headers: event.data.request.headers,
          body: event.data.request.method === "GET" ? undefined : event.data.request.body
        });

        try {
          const response = await handleMockApiRequest(request, config, msgBox, auth);

          window.postMessage({
            type: "VIBE_CODY_API_RESPONSE",
            requestId: event.data.requestId,
            response
          });
        } catch (err) {
          console.error("[VibeCodyApiHandler] Failed to handle request: ", err);

          let errorResponse: {data: {message: string, errors?: any[]}, status: number, statusText: string} = {
            data: { message: 'Internal server error' },
            status: 500,
            statusText: 'Internal Server Error'
          }

          if (err instanceof ValidationError) {
            errorResponse = {
              data: {
                message: 'Validation failed',
                errors: err.errors,
              },
              status: 400,
              statusText: "Bad Request"
            }
          } else if (err instanceof NotFoundError) {
            errorResponse = {
              data: {
                message: err.message,
              },
              status: 404,
              statusText: "Not Found"
            }
          } else if (err && typeof err === "object" && typeof (err as {message: string}).message !== "undefined") {
            if ((err as {message: string}).message === 'AUTH_EMAIL_EXISTS') {
              errorResponse = {
                data: {
                  message: (err as {message: string}).message,
                },
                status: 409,
                statusText: "Conflict"
              }
            } else if ((err as {message: string}).message === 'AUTH_UNAUTHORIZED') {
              errorResponse = {
                data: {
                  message: (err as {message: string}).message,
                },
                status: 401,
                statusText: "Unauthorized"
              }
            }
          }

          window.postMessage({
            type: "VIBE_CODY_API_RESPONSE",
            requestId: event.data.requestId,
            response: errorResponse
          });
        }
      }
    };

    window.addEventListener("message", messageListener);

    const unloadListener = () => {
      window.postMessage(
        { type: "VIBE_CODY_UNREGISTER_API_HANDLER", origin },
        '*'
      );

      window.removeEventListener("message", messageListener);
    };

    window.addEventListener("beforeunload", unloadListener)

    return () => {
      unloadListener();

      window.removeEventListener("beforeunload", unloadListener);
    };
  }, []);
}
