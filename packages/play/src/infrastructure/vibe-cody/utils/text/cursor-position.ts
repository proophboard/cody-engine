export interface CursorPosition {
  start: number | null,
  end: number | null
}

export const getCursorPos = (input: HTMLInputElement): CursorPosition => {
  if ("selectionStart" in input && document.activeElement == input) {
    return {
      start: input.selectionStart || null,
      end: input.selectionEnd
    };
  }

  return {start: null, end: null};
}

export const moveCursor = (cursorPos: CursorPosition, delta: number): CursorPosition => {
  const newPos: CursorPosition = {start: null, end: null};

  if(typeof cursorPos.start === "number") {
    newPos.start = cursorPos.start + delta;
  }

  if(typeof cursorPos.end === "number") {
    newPos.end = cursorPos.end + delta;
  }

  return newPos;
}

export const setCursorPos = (input: HTMLInputElement, start: number, end?: number | null): void => {
  if (typeof end === "undefined") end = start;

  if ("selectionStart" in input) {
    setTimeout(function() {
      input.selectionStart = start;
      input.selectionEnd = end as any;
    }, 1);
  }
}
