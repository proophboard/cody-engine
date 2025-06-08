import nlp from "compromise";
import View from "compromise/types/view/one";

export const includesAllWords = (searchStr: string, words: string[]): boolean => {
  for (const word of words) {
    if(!searchStr.includes(word)) {
      return false;
    }
  }

  return true;
}

export const includesAllNouns = (searchStr: string, words: string[]): boolean => {
  const doc = nlp(words.join(" "));

  const nouns = doc.nouns().out('array');

  if(nouns.length === 0) {
    return false;
  }

  for (const word of nouns) {

    if(!searchStr.includes(word)) {
      return false;
    }
  }

  return true;
}
