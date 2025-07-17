import nlp from "compromise";

export const removeArticles = (text: string): string => {
  const doc = nlp(text);

  return doc.not('#Determiner').text();
}
