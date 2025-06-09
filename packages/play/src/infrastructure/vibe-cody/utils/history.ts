import {PlayConfigDispatch, Playshot} from "@cody-play/infrastructure/cody/cody-message-server";
import {
  cloneConfig,
  CodyPlayConfig,
  enhanceConfigWithDefaults,
  getEditedContextFromConfig
} from "@cody-play/state/config-store";
import {v4} from "uuid";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {CodyResponseType} from "@proophboard/cody-types";
import {saveToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {VIBE_CODY_PROCESSING} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {CodyInstructionResponse} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

type HistoryEntry = Playshot & {currentRoute: string};

const history: HistoryEntry[] = [];

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

export const addHistoryEntry = async (instruction: string, config: CodyPlayConfig, currentRoute: string) => {
  history.push({
    playshotId: v4(),
    name: instruction,
    boardId: config.boardId,
    playConfig: cloneConfig(config),
    playData: {
      streams: cloneDeepJSON(await es.exportStreams()),
      ...cloneDeepJSON(await ds.exportBackup())
    },
    currentRoute,
  })
}

export const hasHistoryEntry = (): boolean => {
  return history.length > 0;
}

export const forgetLast = () => {
  history.pop();
}

export const undoLast = async (dispatch: PlayConfigDispatch, navigateTo: (route: string) => void): Promise<CodyInstructionResponse> => {
  const lastEntry = history.pop();

  if(!lastEntry) {
    return {
      cody: `Can't revert last action. There is no more history entry cached.`,
      type: CodyResponseType.Warning
    }
  }

  navigateTo(VIBE_CODY_PROCESSING);

  return new Promise(async (resolve) => {
    window.setTimeout(async () => {
      dispatch({
        type: "INIT",
        payload: lastEntry.playConfig,
        ctx: getEditedContextFromConfig(lastEntry.playConfig)
      });

      await es.importStreams(lastEntry.playData.streams || {});
      await ds.importBackup({
        documents: lastEntry.playData.documents || {},
        sequences: lastEntry.playData.sequences || {}
      });

      await saveToLocalStorage(
        enhanceConfigWithDefaults(lastEntry.playConfig),
        ds,
        es,
        lastEntry.boardId
      );

      navigateTo(lastEntry.currentRoute);

      resolve({
        cody: `Reverted last change: `,
        details: `"${lastEntry.name}"`,
        type: CodyResponseType.Warning,
      })
    }, 500)
  })
}


