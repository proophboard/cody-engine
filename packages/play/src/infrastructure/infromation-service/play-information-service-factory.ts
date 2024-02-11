import {InformationService} from "@server/infrastructure/information-service/information-service";
import {
  DocumentStoreInformationService
} from "@server/infrastructure/information-service/document-store-information-service";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";

let informationService: InformationService;

export const playInformationServiceFactory = (): InformationService => {
  if(!informationService) {
    informationService = new DocumentStoreInformationService(getConfiguredPlayDocumentStore());
  }

  return informationService;
}
