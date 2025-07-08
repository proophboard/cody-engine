import {UsePageResult} from "@cody-play/hooks/use-play-page-match";
import {FocusedElement} from "@cody-play/state/focused-element";
import {COLOR_MODE} from "@frontend/app/providers/ToggleColorMode";
import {CodyResponse} from "@proophboard/cody-types";
import {CursorPosition} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";
import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

export interface VibeCodyContext {
  page: UsePageResult,
  searchStr: string,
  cursorPosition: CursorPosition,
  selectedInstruction?: Instruction,
  focusedElement?: FocusedElement,
  setFocusedElement: (ele: FocusedElement | undefined) => void,
  colorMode: COLOR_MODE,
  toggleColorMode: () => void,
  hasHistory: boolean,
  undo: () => Promise<CodyResponse>,
}
