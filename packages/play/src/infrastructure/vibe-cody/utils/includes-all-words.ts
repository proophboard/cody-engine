import nlp from "compromise";
import Three from "compromise/types/view/three";

export const includesAllWords = (searchStr: string, words: string[]): boolean => {
  for (const word of words) {
    if(!searchStr.includes(word)) {
      return false;
    }
  }

  return true;
}

export const extractNouns = (sentence: string): string[] => {
  const doc = nlp(sentence);

  const filtered = doc.not('#Determiner') as Three;

  return filtered.nouns().out('text').split(" ");
}

export const includesAllNouns = (searchStr: string, words: string[]): boolean => {
  const nouns = extractNouns(words.join(" "));

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
