import {CursorPosition, moveCursor} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";

export const removeTab = (text: string, cursorPos: CursorPosition): [string, CursorPosition] => {
  let lineOfCursor = 0;
  let delta = 0;

  if(cursorPos.start) {
    const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
    lineOfCursor = linesUntilCursor.length - 1;
  }

  const lines = text.split("\n");

  let cursorLine = lines[lineOfCursor];

  if(cursorLine.startsWith("  ")) {
    cursorLine = cursorLine.substring(2);
    delta = -2;
  }

  lines[lineOfCursor] = cursorLine;

  return [lines.join("\n"), moveCursor(cursorPos, delta)];
}
