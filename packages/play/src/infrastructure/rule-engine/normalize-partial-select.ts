import {isLookup, PartialSelect} from "@event-engine/infrastructure/DocumentStore";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const normalizePartialSelect = (select: PartialSelect, service: string, config: CodyPlayConfig): PartialSelect => {
  return select.map(s => {
    if(isLookup(s)) {
      s.lookup = playGetVoRuntimeInfoFromDataReference(s.lookup, service, config.types).desc.name;
    }

    return s;
  })
}
