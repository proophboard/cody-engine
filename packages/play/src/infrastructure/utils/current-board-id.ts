import {environment} from "@cody-play/environments/environment";

const BOARD_SESSION_STORAGE_KEY = 'cody_play_board';

let currentBoardIdVal: string | null;

export const currentBoardId = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const currentBoardIdFormSearch = params.get('board');

  if(currentBoardIdFormSearch) {
    sessionStorage.setItem(BOARD_SESSION_STORAGE_KEY, currentBoardIdFormSearch);
    currentBoardIdVal = currentBoardIdFormSearch;
  } else {
    currentBoardIdVal = sessionStorage.getItem(BOARD_SESSION_STORAGE_KEY);
  }


  return currentBoardIdVal;
}
