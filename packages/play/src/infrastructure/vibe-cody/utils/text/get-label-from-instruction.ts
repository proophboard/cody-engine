export const getLabelFromInstruction = (instruction: string, fixedText: string): string => {
  const variablePart = instruction.replace(fixedText, '').trim();

  const normalizedInput = variablePart.replaceAll(`'`, `"`);

  if(normalizedInput.includes(`"`)) {
    const parts = normalizedInput.split(`"`);

    if(parts.length > 1) {
      return parts[1];
    } else {
      return normalizedInput;
    }
  } else {
    return normalizedInput;
  }
}
