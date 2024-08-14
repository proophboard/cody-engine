import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayMessageBox} from "@cody-play/infrastructure/message-box/play-message-box";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";

let messageBox: PlayMessageBox;

export const getConfiguredPlayMessageBox = (config: CodyPlayConfig, newInstance = false): PlayMessageBox => {
  if(newInstance) {
    return new PlayMessageBox(config, getConfiguredPlayAuthService());
  }

  if(!messageBox) {
    messageBox = new PlayMessageBox(config, getConfiguredPlayAuthService());
  } else {
    messageBox.updateConfig(config, getConfiguredPlayAuthService());
  }

  return messageBox;
}
