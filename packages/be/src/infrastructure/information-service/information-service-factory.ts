import {InformationService} from "@server/infrastructure/information-service/information-service";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";
import {
  DocumentStoreInformationService
} from "@server/infrastructure/information-service/document-store-information-service";
import {types} from "@app/shared/types";

let infoService: InformationService;

export const informationServiceFactory = (): InformationService => {
  if(infoService) {
    return infoService;
  }

  const ds = getConfiguredDocumentStore();

  infoService = new DocumentStoreInformationService(ds, types);

  return infoService;
}
