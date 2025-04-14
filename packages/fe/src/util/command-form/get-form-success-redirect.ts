import {PlayCommandRuntimeInfo} from "@cody-play/state/types";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {PageRegistry} from "@frontend/app/pages";
import {generatePageLink, getPageDefinition} from "@frontend/app/components/core/PageLink";

export const getFormSuccessRedirect = (commandInfo: PlayCommandRuntimeInfo | CommandRuntimeInfo, ctx: any, defaultService: string, pages: PageRegistry): string | null => {
  const uiSchema = commandInfo.uiSchema;

  if(!uiSchema || !uiSchema['ui:form'] || typeof uiSchema['ui:form'] !== "object") {
    return null;
  }

  const uiForm = {...uiSchema['ui:form']};

  if(uiForm.successRedirect) {
    if(typeof uiForm.successRedirect === "string" && uiForm.successRedirect.includes("/")) {
      return uiForm.successRedirect;
    }

    const paramsMapping: Record<string, any> = {};
    const pageLink = typeof uiForm.successRedirect === "string" ? {page: uiForm.successRedirect, mapping: undefined} : uiForm.successRedirect;

    if (typeof pageLink === 'object' && pageLink.mapping) {
      for (const mappingKey in pageLink.mapping) {
        paramsMapping[mappingKey] = jexl.evalSync(
          pageLink.mapping[mappingKey],
          ctx
        );
      }
    }

    return generatePageLink(
      getPageDefinition(
        pageLink.page,
        defaultService,
        pages
      ),
      { ...ctx.routeParams, ...paramsMapping }
    );
  }

  if(uiForm['successRedirect:expr']) {
    return jexl.evalSync(uiForm['successRedirect:expr'], ctx);
  }

  return null;
}
