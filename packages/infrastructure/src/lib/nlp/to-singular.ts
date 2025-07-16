import nlp from "compromise";

export const toSingular = (words: string): string => {
  const doc = nlp(words + ' are great.');

  doc.nouns().toSingular();

  return doc.text().slice(0, -11);
}

export const toSingularItemName = (words: string): string => {
  const singular = toSingular(words);

  if(words === singular) {
    return `${words}Item`;
  }

  return singular;
}
