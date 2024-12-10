import * as React from 'react';
import {HtmlConfig} from "@frontend/app/components/core/form/widgets/HtmlWidget";
import {JSONSchema7} from "json-schema-to-ts";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {names} from "@event-engine/messaging/helpers";
import {types} from "@app/shared/types";
import {isQueryableDescription} from "@event-engine/descriptions/descriptions";
import {useParams} from "react-router-dom";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {execMappingSync} from "@cody-play/infrastructure/rule-engine/make-executable";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import StaticHtmlWidget from "@frontend/app/components/core/form/widgets/html/StaticHtmlWidget";
import {CircularProgress} from "@mui/material";
import {WidgetProps} from "@rjsf/utils";

export type JSONSchemaWithId = JSONSchema7 & {$id: string};

interface OwnProps {
  config: HtmlConfig;
  data: string;
  query: Record<string, string>;
  rootSchema: JSONSchemaWithId;
  formData: object;
  value: unknown;
  id: string;
  label?: string;
  hideLabel?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  style?: React.StyleHTMLAttributes<unknown>;
}

type DynamicHtmlWidgetProps = OwnProps & WidgetProps;

const DynamicHtmlWidget = (props: DynamicHtmlWidgetProps) => {
  const routeParams = useParams();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [store,] = useGlobalStore();

  const {desc} = getVOFromTypes(props.data, props.rootSchema);

  if(!isQueryableDescription(desc)) {
    throw new Error(`DynamicHtmlWidget: ${props.data} is not queryable!`);
  }

  const jexlCtx = {
    routeParams,
    data: props.formData || {},
    user,
    page: pageData,
    store,
    value: props.value,
    result: undefined
  };

  const queryParams = execMappingSync(props.query, jexlCtx);

  const query = useApiQuery(desc.query, queryParams);
  let config = props.config;

  if(query.isSuccess) {
    jexlCtx.result = query.data;

    config = normalizeUiSchema(config, jexlCtx);

    return <StaticHtmlWidget
      {...props}
      config={config}
      id={props.id}
      label={props.label}
      style={props.style}
      disabled={props.disabled}
      hideLabel={props.hideLabel}
      hidden={props.hidden}
    />
  }

  // @TODO: error handling

  return <CircularProgress />
};

export default DynamicHtmlWidget;


const getVOFromTypes = (refOrFQCN: string, rootSchema: JSONSchemaWithId): ValueObjectRuntimeInfo => {
  if(refOrFQCN[0] === "/") {
    const rootId = rootSchema.$id || '';
    const definitionIdParts = rootId.replace('/definitions/', '').split('/');
    const service = names(definitionIdParts[0] || '').className;
    refOrFQCN = (service + refOrFQCN).split("/").join(".");
  }

  if(!types[refOrFQCN]) {
    throw new Error(`DynamicHtmlWidget: Unknown type "${refOrFQCN}"`);
  }

  return types[refOrFQCN];
}
