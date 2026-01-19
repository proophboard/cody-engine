import {User} from "@app/shared/types/core/user/user";
import {names} from "@event-engine/messaging/helpers";
import {PlayMessageBox} from "@cody-play/infrastructure/message-box/play-message-box";
import {PlayAuthService} from "@cody-play/infrastructure/auth/play-auth-service";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";

export type RequestMethod = "GET" | "POST";

export interface GetMessageOptions {
  messageName: string;
  query: Record<string, string>;
  user: User | null;
}

export interface PostMessageOptions {
  messageName: string;
  body: any;
  user: User | null;
}

export type ResponseMessage = {
  data: any,
  status: number,
  statusText: string,
}

export async function parseRequestBody(request: Request): Promise<any> {
  if (request.method === "GET" || request.method === "HEAD") return null;

  const contentType = request.headers.get("content-type") || "";
  const cloned = request.clone();

  if (contentType.includes("application/json")) {
    return cloned.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await cloned.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};

    // TS-safe iteration over URLSearchParams
    params.forEach((value, key) => {
      body[key] = value;
    });

    return body;
  }

  if (contentType.includes("text/plain")) return cloned.text();

  return cloned.text(); // fallback
}

export async function parseQuery(request: Request): Promise<Record<string, string>> {
  const url = new URL(request.url);
  const query: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    query[key] = value;
  })

  return query;
}


/**
 * Extract /messages/:messageName
 */
export function parseMessagesPath(pathname: string): { messageName: string } | null {
  console.log("[mock-api-handler] Parsing pathname:", pathname);
  // Match both possible path formats: /api-mock/messages/..., /__vibe__cody__ai/mock-api-handler/messages/..., or /messages/...
  const match = pathname.match(/^(?:\/__vibe__cody__ai\/mock-api-handler|\/api-mock)?\/messages\/([^/?]+)/);
  console.log("[mock-api-handler] Regex match result:", match);
  if (!match) return null;
  return { messageName: decodeURIComponent(match[1]) };
}

/**
 * Extract CE-User header
 */
export function parseMockedUser(headers: Headers): { userId: string | null } {
  const userId = headers.get("ce-user");
  return { userId: userId ?? null };
}

/**
 * Main handler
 */
export async function handleMockApiRequest(request: Request, config: CodyPlayConfig, mbox: PlayMessageBox, auth: PlayAuthService): Promise<ResponseMessage> {
  const url = new URL(request.url);
  const method = request.method as RequestMethod;

  console.log("handleMockApiRequest: ", url);

  const route = parseMessagesPath(url.pathname);
  if (!route) {
    return {
      data: { error: "Not found" },
      status: 404,
      statusText: "Not Found"
    }
  }

  const { messageName } = route;
  const query = await parseQuery(request);
  const { userId } = parseMockedUser(request.headers);

  let user = null;

  if(userId) {
    user = await auth.get(userId) as User;
  }

  // @TODO: Return unauthorized response

  if (method === "GET") {
    return await handleGetMessage({ messageName, query, user }, config, mbox);
  }

  if (method === "POST") {
    const body = await parseRequestBody(request);
    return await handlePostMessage({ messageName, body, user }, config, mbox);
  }

  return {
    data: { error: "Method not allowed" },
    status: 405,
    statusText: "Method Not Allowed"
  }
}

/* ============================================================
   Endpoint handlers
   ============================================================ */

async function handleGetMessage({ messageName, query, user }: GetMessageOptions, config: CodyPlayConfig, mbox: PlayMessageBox): Promise<ResponseMessage> {
  const queryName = `${config.defaultService}.${names(messageName).className}`;
  const queryInfo = config.queries[queryName];

  if(!user) {
    const anyone = config.personas.filter(p => p.displayName === "Anyone").pop();

    if(!anyone) {
      throw new Error("No user associated with the request and the default user Anyone is missing in the playshot. Cannot process the request");
    }

    user = anyone;
  }

  if(!queryInfo) {
    throw new Error(`Cannot perform query "${queryName}". Query info cannot be found. Did you forget to pass the corresponding Information card to Cody?`);
  }

  const payload = determineQueryPayload(query, queryInfo as unknown as QueryRuntimeInfo);

  const response = await mbox.dispatch(queryName, payload, {user});

  return {
    data: response,
    status: 200,
    statusText: "OK"
  }
}

async function handlePostMessage({ messageName, body, user }: PostMessageOptions, config: CodyPlayConfig, mbox: PlayMessageBox): Promise<ResponseMessage> {

  const commandName = `${config.defaultService}.${names(messageName).className}`;

  if(!user) {
    const anyone = config.personas.filter(p => p.displayName === "Anyone").pop();

    if(!anyone) {
      throw new Error("No user associated with the request and the default user Anyone is missing in the playshot. Cannot process the request");
    }

    user = anyone;
  }

  const response = await mbox.dispatch(commandName, body, {user});

  // @TODO: Handle unknown command

  return {
    data: {
      success: true
    },
    status: 201,
    statusText: "ACCEPTED"
  }
}
