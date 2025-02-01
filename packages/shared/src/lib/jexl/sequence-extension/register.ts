import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {SequenceProvider} from "@event-engine/infrastructure/sequence-provider/sequence-provider";

let sequenceProvider: SequenceProvider;

export const setupSequenceProvider = (seqProvider: SequenceProvider): void => {
  sequenceProvider = seqProvider;
}

export const registerSequenceExtension = (jexl: Jexl): void => {
  jexl.addFunction('nextval', async (name: string): Promise<number> => {
    if(!sequenceProvider) {
      throw new Error(`Invalid function call "nextval('${name}')" in expression. No sequence provider available. Either the expression is used in a frontend context, where sequences are not available, or you have a bug in your server bootstrap logic, because a sequence provider is usually set up in that phase.`);
    }

    return await sequenceProvider.getNextSequenceValue(name);
  })
}
