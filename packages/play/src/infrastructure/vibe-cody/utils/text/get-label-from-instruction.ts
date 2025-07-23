import {isExpression} from "@cody-play/infrastructure/vibe-cody/utils/text/is-expression";

export const getLabelFromInstruction = (instruction: string, fixedText: string): string => {
  if(!instruction.startsWith(fixedText)) {
    return '';
  }

  const variablePart = instruction.replace(fixedText, '').trim();

  const normalizedInput = isExpression(variablePart, true)
    ? variablePart
    : variablePart.replaceAll(`'`, `"`);

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
