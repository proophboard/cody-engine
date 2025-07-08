export const addNewLine = (text: string): string => {
  const lines = text.split("\n");

  const lastLine = lines[lines.length - 1];

  const match = lastLine.match(/^([- ]*)/);

  const prevLineStarting = match ? match[1] : '';

  return `${text}\n${prevLineStarting}`;
}
