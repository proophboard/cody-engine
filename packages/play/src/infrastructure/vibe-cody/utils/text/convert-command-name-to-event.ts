import nlp from "compromise";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {verbToPastTense} from "@cody-play/infrastructure/vibe-cody/utils/text/verb-to-past-tense";

export const convertCommandNameToEvent = (cmdName: string): string | CodyResponse => {
  cmdName = cmdName.trim();

  const doc = nlp(cmdName)

  if(doc.verbs().length === 0 || doc.nouns().length === 0) {
    return {
      cody: `Sorry, I don't understand your action description. Please refine the description. A simple sentence in imperative mood "verb article noun" works best.`,
      details: `Examples: "book a room", "rent a car", "buy a house", ...`,
      type: CodyResponseType.Error
    }
  }

  if(!doc.verbs().isImperative()) {
    return {
      cody: `Sorry, I don't understand your action description. It should be written in imperative mood, e.g. "finish the project", "register a user", "book a room", ...`,
      details: `Please refine your action description.`,
      type: CodyResponseType.Error
    }
  }

  const firstVerb = doc.verbs().first();

  const words = doc
    .not('#Determiner')
    .text()
    .split(" ")
    .map((w: string) => w.trim());

  if (words.length === 0) return ''

  if(!cmdName.startsWith(firstVerb.text())) {
    return {
      cody: `Sorry, I don't understand your action description. It should be written in imperative mood, e.g. "finish the project", "register a user", "book a room", ...`,
      details: `Please refine your action description.`,
      type: CodyResponseType.Error
    }
  }

  // Get the remaining words (nouns/objects)
  const objectWords = words.slice(1);

  return `${objectWords.join(' ')} ${verbToPastTense(firstVerb.text())}`;
}
