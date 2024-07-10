import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayMessageBox} from "@cody-play/infrastructure/message-box/play-message-box";

let messageBox: PlayMessageBox;

export const getConfiguredPlayMessageBox = (config: CodyPlayConfig, newInstance = false): PlayMessageBox => {
  if(newInstance) {
    return new PlayMessageBox(config);
  }

  if(!messageBox) {
    messageBox = new PlayMessageBox(config);
  } else {
    messageBox.updateConfig(config);
  }

  return messageBox;
}
