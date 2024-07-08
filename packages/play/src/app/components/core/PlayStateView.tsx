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
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import {useUser} from "@frontend/hooks/use-user";
import jexl from "@app/shared/jexl/get-configured-jexl";

const PlayStateView = (params: any, informationInfo: PlayInformationRuntimeInfo) => {
  const {config: {definitions}} = useContext(configStore);
  const [page, addQueryResult] = usePageData();
  const desc = informationInfo.desc;
  const [user] = useUser();

  const jexlCtx = {routeParams: params, user, page};

  const query = useApiQuery((desc as QueryableStateDescription).query, params);

  let isHidden = false;

  const uiSchema = {...informationInfo.uiSchema} || {};

  if(typeof uiSchema['ui:hidden'] !== "undefined") {
    if(typeof uiSchema['ui:hidden'] === "string") {
      isHidden = jexl.evalSync(uiSchema['ui:hidden'], jexlCtx);
      delete uiSchema['ui:hidden'];
    } else {
      isHidden = uiSchema['ui:hidden'];
    }
  }

  useEffect(() => {
    addQueryResult(registryIdToDataReference(desc.name), query);
  }, [params, query.dataUpdatedAt]);

  if(!isQueryableStateDescription(desc) && !isQueryableValueObjectDescription(desc) && !isQueryableNotStoredValueObjectDescription(desc)) {
    return <Alert severity="error" >Unable to render view. Referenced Information "{informationInfo.desc.name}" is not queryable and cannot be loaded from the database. You have to define a query schema and resolve configuration in the Cody Wizard.</Alert>
  }

  if(isHidden) {
    return <></>
  }

  return <>
    {query.isLoading && <CircularProgress />}
    {query.isSuccess && <StateView
        state={query.data}
        description={{...informationInfo, uiSchema, factory: makeInformationFactory(informationInfo.factory)}}
        definitions={definitions}
        widgets={{
          DataSelect: PlayDataSelectWidget
        }}
      />
    }
  </>
}

export default PlayStateView;
