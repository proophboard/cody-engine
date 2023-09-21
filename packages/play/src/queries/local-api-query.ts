import {ApiQuery} from "@frontend/queries/use-api-query";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {brand, Brand} from "@app/shared/types/fleet-management/car/brand";
import {BrandListDesc} from "@app/shared/types/fleet-management/car/brand-list.desc";
import {filters} from "@event-engine/infrastructure/DocumentStore/Filter/index";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {CarListDesc} from "@app/shared/types/fleet-management/car/car-list.desc";
import {Car, car} from "@app/shared/types/fleet-management/car/car";

export const localApiQuery: ApiQuery = async (queryName: string, params: any): Promise<any> => {
  const ds = getConfiguredPlayDocumentStore();

  if(queryName === 'FleetManagement.GetBrandList') {
    const cursor = await ds.findDocs<{ state: Brand }>(
      BrandListDesc.collection,
      new filters.AnyFilter(),
      undefined,
      undefined,
      undefined
    );

    return asyncIteratorToArray(asyncMap(cursor, ([, d]) => brand(d.state)));
  }

  if(queryName === 'FleetManagement.GetCarList') {
    const cursor = await ds.findDocs<{state: Car}>(CarListDesc.collection, new filters.AnyFilter());

    return asyncIteratorToArray(asyncMap(cursor, ([, d]) => car(d.state)));
  }

  return [];
}
