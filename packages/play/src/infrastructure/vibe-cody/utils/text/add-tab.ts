import {CursorPosition, moveCursor} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";

export const addTab = (text: string, cursorPos: CursorPosition): [string, CursorPosition] => {
  let lineOfCursor = 0;

  if(cursorPos.start) {
    const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
    lineOfCursor = linesUntilCursor.length - 1;
  }

  const lines = text.split("\n");

  const cursorLine = lines[lineOfCursor];

  lines[lineOfCursor] = `  ${cursorLine}`;

  return [lines.join("\n"), moveCursor(cursorPos, 2)];
}
