import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import StateView from "@frontend/app/components/core/StateView";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableValueObjectDescription,
  QueryableStateDescription
} from "@event-engine/descriptions/descriptions";
import {Alert, CircularProgress} from "@mui/material";
import {usePageData} from "@frontend/hooks/use-page-data";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";

const PlayStateView = (params: any, informationInfo: PlayInformationRuntimeInfo) => {
  const {config: {definitions}} = useContext(configStore);
  const [, addQueryResult] = usePageData();
  const desc = informationInfo.desc;

  const query = useApiQuery((desc as QueryableStateDescription).query, params);

  useEffect(() => {
    addQueryResult(registryIdToDataReference(desc.name), query);
  }, [params, query.dataUpdatedAt]);

  if(!isQueryableStateDescription(desc) && !isQueryableValueObjectDescription(desc) && !isQueryableNotStoredValueObjectDescription(desc)) {
    return <Alert severity="error" >Unable to render view. Referenced Information "{informationInfo.desc.name}" is not queryable and cannot be loaded from the database. You have to define a query schema and resolve configuration in the Cody Wizard.</Alert>
  }

  return <>
    {query.isLoading && <CircularProgress />}
    {query.isSuccess && <StateView
        state={query.data}
        description={{...informationInfo, factory: makeInformationFactory(informationInfo.factory)}}
        definitions={definitions}
      />
    }
  </>
}

export default PlayStateView;
