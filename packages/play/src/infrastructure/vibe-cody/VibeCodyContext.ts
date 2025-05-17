import {UsePageResult} from "@cody-play/hooks/use-play-page-match";
import {FocusedElement} from "@cody-play/state/focused-element";

export interface VibeCodyContext {
  page: UsePageResult,
  focusedElement?: FocusedElement,
}
