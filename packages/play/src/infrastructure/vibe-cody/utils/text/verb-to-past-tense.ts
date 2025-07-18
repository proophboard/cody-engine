import nlp from "compromise";

export const verbToPastTense = (verb: string): string => {
  const standardSentence = `You ${verb} it.`;

  const doc = nlp(standardSentence);

  doc.verbs().toPastTense();

  return doc.text().slice(4, -4);
}
