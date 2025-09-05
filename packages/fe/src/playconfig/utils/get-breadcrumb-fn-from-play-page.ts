import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {BreadcrumbFn} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {isDynamicBreadcrumb} from "@cody-engine/cody/hooks/utils/ui/types";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription, isQueryableStateListDescription,
  isQueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {dynamicLabel} from "@frontend/util/breadcrumb/dynamic-label";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {getApiQuery} from "@frontend/queries/use-api-query";

export const getBreadcrumbFnFromPlayPage = (page: PlayPageDefinition, config: CodyPlayConfig): BreadcrumbFn => {
  if(typeof page.breadcrumb === "string") {
    return staticLabel(page.breadcrumb);
  } else if (isDynamicBreadcrumb(page.breadcrumb)){
    const vo = playGetVoRuntimeInfoFromDataReference(page.breadcrumb.data, page.service, config.types);
    const voDesc = vo.desc;

    if(!isQueryableStateDescription(voDesc) && !isQueryableValueObjectDescription(voDesc) && !isQueryableNotStoredValueObjectDescription(voDesc) && isQueryableStateListDescription(voDesc)) {
      return staticLabel(`Error! "${voDesc.name}" is not queryable`);
    }

    const {label} = page.breadcrumb;
    const query = (voDesc as unknown as {query: string}).query;

    return dynamicLabel(
      query,
      params => {
        return (getApiQuery())(query, params);
      },
      data => {
        let ctx = {data, value: ''};

        if(typeof label === "string") {
          ctx.value = jexl.evalSync(label, ctx);
        } else {
          const exe = makeSyncExecutable(label);
          ctx = exe(ctx);
        }

        return ctx.value;
      }
    )
  }

  return staticLabel('Breadcrumb Config Error!');
}
