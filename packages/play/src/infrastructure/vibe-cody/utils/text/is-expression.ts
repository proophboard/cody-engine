export const isExpression = (text: string, enableQuoteCheck?: boolean): boolean => {
  return text.startsWith('$> ') || (!!enableQuoteCheck && text.startsWith('"$> '));
}
