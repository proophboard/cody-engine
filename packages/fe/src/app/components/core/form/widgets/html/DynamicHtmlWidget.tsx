import * as React from 'react';
import {HtmlConfig} from "@frontend/app/components/core/form/widgets/HtmlWidget";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {names} from "@event-engine/messaging/helpers";
import {types} from "@app/shared/types";
import {isQueryableDescription} from "@event-engine/descriptions/descriptions";
import {useParams} from "react-router-dom";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import StaticHtmlWidget from "@frontend/app/components/core/form/widgets/html/StaticHtmlWidget";
import {CircularProgress, useTheme} from "@mui/material";
import {WidgetProps} from "@rjsf/utils";
import {JSONSchemaWithId} from "@frontend/app/components/core/form/widgets/json-schema/json-schema-with-id";
import {execMappingSync} from "@app/shared/rule-engine/exec-mapping";
import {useEnv} from "@frontend/hooks/use-env";
import {FormJexlContextV2} from "@frontend/app/components/core/form/types/form-jexl-context";


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
  jexlCtx: FormJexlContextV2;
}

type DynamicHtmlWidgetProps = OwnProps & WidgetProps;

const DynamicHtmlWidget = (props: DynamicHtmlWidgetProps) => {
  const routeParams = useParams();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [store,] = useGlobalStore();
  const env = useEnv();
  const theme = useTheme();

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
    theme,
    result: undefined
  };

  const queryParams = execMappingSync(props.query, jexlCtx);

  const query = useApiQuery(desc.query, queryParams);
  let config = props.config;

  if(query.isSuccess) {
    jexlCtx.result = query.data;

    config = normalizeUiSchema(config, jexlCtx, env);

    delete config.data;
    delete config.hidden;
    delete config.if;
    delete config.query;

    return <StaticHtmlWidget
      {...props}
      config={config}
      id={props.id}
      label={props.label}
      style={props.style}
      disabled={props.disabled}
      hideLabel={props.hideLabel}
      hidden={props.hidden}
      jexlCtx={props.jexlCtx}
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
