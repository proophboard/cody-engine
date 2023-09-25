import {CodyResponse, CodyResponseType, makeNodeRecord, Node, RawNodeRecordProps} from "@proophboard/cody-types";
import {greeting, IioSaidHello} from "@proophboard/cody-server/lib/src/http/greeting";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {Map} from "immutable";
import {checkQuestion, test, handleReply, Reply} from "@proophboard/cody-server/lib/src/http/question";
import {ElementEdited} from "@proophboard/cody-server/lib/src/http/elementEdited";
import {Action, CodyPlayConfig} from "@cody-play/state/config-store";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";

interface Message {
  messageId: string;
  messageName: 'IioSaidHello' | 'UserReplied' | 'ElementEdited' | 'ConfirmTest' | 'Sync' | 'SyncDeleted' | 'FullSync';
  payload: any;
}

interface Response {
  responseTo: string;
  codyResponse: CodyResponse;
}

interface Sync {
  boardId: string;
  nodes: RawNodeRecordProps[];
}

const allowedOrigins = ['https://ee.local', 'http://localhost:3001', 'https://free.prooph-board.com', 'https://app.prooph-board.com'];

export type PlayConfigDispatch = (action: Action) => void;

export type ElementEditedContext = {boardId: string, boardName: string, userId: string, syncedNodes: Map<string, Node>};

export class CodyMessageServer {
  private pbTab: typeof window | undefined;
  private syncRequired = true;
  private syncedNodes = Map<string, Node>();
  private dispatch: PlayConfigDispatch;
  private config: CodyPlayConfig;


  public constructor(config: CodyPlayConfig, dispatch: PlayConfigDispatch) {
    this.config = config;
    this.dispatch = dispatch;
    if(window.opener) {
      this.pbTab = window.opener;

      window.addEventListener('message', (msg) => {
        try {
          if(!allowedOrigins.includes(msg.origin)) {
            console.log("[CodyMessageServer] Ignored message: ", msg);
            return;
          }

          const message: Message = JSON.parse(msg.data);

          if(!message.messageId) {
            throw new Error(`[CodyMessageServer] Received message is missing a messageId: ${JSON.stringify(msg)}`);
          }

          this.handleMessage(message.messageName, message.payload).then(res => {
            const responseMsg: Response = {
              responseTo: message.messageId,
              codyResponse: res
            }

            this.pbTab?.postMessage(JSON.stringify(responseMsg), msg.origin);
          })
        } catch (e) {
          console.error("[CodyMessageServer] failed to handle message: ", e, msg);
        }
      })

      console.log("[CodyMessageServer] connected");
    }

    // Send handshake msg
    window.setTimeout(() => {
      this.pbTab?.postMessage(JSON.stringify({ping: '[CodyMessageServer]'}), '*');
    }, 100);
  }

  public updateConfig(config: CodyPlayConfig): void {
    this.config = config;
  }

  public isConnected(): boolean {
    return !!this.pbTab;
  }

  private async handleMessage(messageName: string, payload: any): Promise<CodyResponse> {
    console.log("[CodyMessageServer] going to handle message: ", messageName, payload);
    switch (messageName) {
      case "IioSaidHello":
        return this.handleIioSaidHello(payload);
      case "FullSync":
        return this.handleFullSync(payload);
      case "Sync":
        return this.handleSync(payload);
      case "SyncDeleted":
        return this.handleSyncDeleted(payload);
      case "UserReplied":
        return this.handleUserReplied(payload);
      case "ConfirmTest":
        return this.handleConfirmTest(payload);
      case "ElementEdited":
        return this.handleElementEdited(payload);
      default:
        return {
          cody: `Unknown message received: ${messageName}`,
          type: CodyResponseType.Warning,
          details: CONTACT_PB_TEAM
        }
    }
  }

  private async handleIioSaidHello(payload: IioSaidHello): Promise<CodyResponse> {
    this.syncRequired = true;

    return greeting(payload.user);
  }

  private async handleElementEdited(payload: ElementEdited): Promise<CodyResponse> {
    if(this.syncRequired) {
      this.syncedNodes = Map<string, Node>();

      return {
        cody: 'I need to sync all elements first.',
        details: "Lean back for a moment. I'll let you know when I'm done.",
        type: CodyResponseType.SyncRequired
      };
    }

    return checkQuestion(await onNode(makeNodeRecord(payload.node), this.dispatch, {...payload.context, syncedNodes: this.syncedNodes}, this.config));
  }

  private async handleFullSync(payload: Sync): Promise<CodyResponse> {
    this.syncRequired = false;

    const nodes: Node[] = payload.nodes.map(makeNodeRecord);

    nodes.forEach(node => this.syncedNodes = this.syncedNodes.set(node.getId(), node));

    return {
      cody: '',
      type: CodyResponseType.Empty
    }
  }

  private async handleSync(payload: Sync): Promise<CodyResponse> {
    if(this.syncRequired) {
      // Seems like server lost in-memory sync due to restart but InspectIO continues to send sync requests
      // Ignore sync until user triggers next code generation and therefore next full sync
      return {
        cody: '',
        type: CodyResponseType.Empty
      }
    }

    payload.nodes.map(makeNodeRecord).forEach(node => this.syncedNodes = this.syncedNodes.set(node.getId(), node));

    return {
      cody: '',
      type: CodyResponseType.Empty
    }
  }

  private async handleSyncDeleted(payload: Sync): Promise<CodyResponse> {
    if(this.syncRequired) {
      // Seems like server lost in-memory sync due to restart but InspectIO continues to send sync requests
      // Ignore sync until user triggers next code generation and therefore next full sync
      return {
        cody: '',
        type: CodyResponseType.Empty
      }
    }

    payload.nodes.map(makeNodeRecord).forEach(node => this.syncedNodes = this.syncedNodes.delete(node.getId()));

    return {
      cody: '',
      type: CodyResponseType.Empty
    }
  }

  private async handleUserReplied(payload: Reply): Promise<CodyResponse> {
    const res = await handleReply(payload.reply);

    return checkQuestion(res);
  }

  private async handleConfirmTest(payload: any): Promise<CodyResponse> {
    return checkQuestion(test());
  }
}
