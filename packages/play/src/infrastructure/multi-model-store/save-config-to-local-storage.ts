import {CodyPlayConfig, CONFIG_STORE_LOCAL_STORAGE_KEY} from "@cody-play/state/config-store";

export const saveConfigToLocalStorage = (config: CodyPlayConfig, boardId: string) => {
  localStorage.setItem(CONFIG_STORE_LOCAL_STORAGE_KEY + boardId, JSON.stringify(config));
}
