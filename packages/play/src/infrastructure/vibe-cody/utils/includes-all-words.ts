export const includesAllWords = (searchStr: string, words: string[]): boolean => {
  for (const word of words) {
    if(!searchStr.includes(word)) {
      return false;
    }
  }

  return true;
}
