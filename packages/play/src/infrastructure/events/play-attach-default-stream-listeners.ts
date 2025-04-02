import {PlayStreamListener} from "@cody-play/infrastructure/multi-model-store/make-stream-listener";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {MessageBox} from "@event-engine/messaging/message-box";

let publicStreamListener: PlayStreamListener;
let writeModelStreamListener: PlayStreamListener;

export const playAttachDefaultStreamListeners = (es: InMemoryEventStore, messageBox: MessageBox) => {
  if(!publicStreamListener) {
    publicStreamListener= new PlayStreamListener(es, 'public_stream', messageBox);
    publicStreamListener.startProcessing();
  }

  if(!writeModelStreamListener) {
    writeModelStreamListener = new PlayStreamListener(es, 'write_model_stream', messageBox);
    writeModelStreamListener.startProcessing();
  }
}
