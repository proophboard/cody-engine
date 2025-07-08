import {CursorPosition} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";

export const getCurrentLine = (text: string, cursorPos: CursorPosition): string => {
  let lineOfCursor = 0;

  if(cursorPos.start) {
    const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
    lineOfCursor = linesUntilCursor.length - 1;
  }

  const lines = text.split("\n");

  return lines[lineOfCursor] || '';
}
