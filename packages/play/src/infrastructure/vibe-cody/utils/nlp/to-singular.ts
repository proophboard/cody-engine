import nlp from "compromise";

export const toSingular = (words: string): string => {
  const doc = nlp(words);

  doc.nouns().toSingular();

  return doc.text();
}

export const toSingularItemName = (words: string): string => {
  const singular = toSingular(words);

  if(words === singular) {
    return `${words}Item`;
  }

  return singular;
}
