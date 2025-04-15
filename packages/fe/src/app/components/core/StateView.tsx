import * as React from 'react';
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {
  Field,
  getUiOptions,
  RJSFSchema, UiSchema,
  Widget
} from "@rjsf/utils";
import {Alert, Box, Button, Card, CardContent, CircularProgress, SxProps, Typography, useTheme} from "@mui/material";
import {PropsWithChildren, useContext, useEffect} from "react";
import {Form} from "@rjsf/mui";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {widgets} from "@frontend/app/components/core/form/widgets";
import {fields} from "@frontend/app/components/core/form/fields";
import {cloneSchema, resolveRefs, resolveUiSchema} from "@event-engine/messaging/resolve-refs";
import definitions from "@app/shared/types/definitions";
import {useUser} from "@frontend/hooks/use-user";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {
  default as ObjectFieldTemplate
} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {merge} from "lodash/fp";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTypes} from "@frontend/hooks/use-types";
import {useTranslation} from "react-i18next";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";
import {translateSchema} from "@frontend/util/schema/translate-schema";
import {useEnv} from "@frontend/hooks/use-env";
import {ArrayFieldTemplate} from "@frontend/app/components/core/form/templates/ArrayFieldTemplate";
import {FormModeType} from "@frontend/app/components/core/CommandForm";

interface OwnProps {
  state?: any;
  description: ValueObjectRuntimeInfo;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  templates?: {[name: string]: React.FunctionComponent<any>};
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
  hidden?: boolean;
  mode?: FormModeType;
}

type StateViewProps = OwnProps;

const StateView = (props: StateViewProps) => {
  const theme = useTheme();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [types] = useTypes();
  const routeParams = useParams();
  const [globalStore] = useGlobalStore();
  const {t} = useTranslation();
  const env = useEnv();
  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    data: props.state || {},
    routeParams,
    store: globalStore,
  }

  const resolvedUiSchema = resolveUiSchema(
    props.description.schema as any,
    types,
    (s, k) => translateUiSchema(s, k, t)
  );

  const mainUiSchema = props.description.uiSchema
    ? translateUiSchema(props.description.uiSchema, `${props.description.desc.name}.uiSchema`, t)
    : undefined;
  const mergedUiSchema: UiSchema = merge(resolvedUiSchema, mainUiSchema) as UiSchema;
  const uiSchema = Object.keys(mergedUiSchema).length > 0
    ? {
      "ui:readonly": true,
      ...normalizeUiSchema(mergedUiSchema, jexlCtx, env)
    }
    : {"ui:readonly": true};

  const userWidgets = props.widgets || {};
  const uiOptions = getUiOptions(uiSchema);

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [props.state]);

  const schema = resolveRefs(
    translateSchema(props.description.schema as any, `${props.description.desc.name}.schema`, t),
    props.definitions || definitions,
    false,
    (s, k) => translateSchema(s, k, t)
  ) as RJSFSchema;

  const infoFQCN = playFQCNFromDefinitionId(schema['$id'] || '');
  const defaultService = infoFQCN.split(".").shift() || '';

  const informationRuntimeInfo = types[infoFQCN];

  if(!informationRuntimeInfo) {
    return <Alert severity="error">Information {infoFQCN} cannot be found in the types config!</Alert>
  }

  if(props.hidden) {
    return <></>;
  }

  return <Box sx={theme.stateView.styleOverrides}>
    <Form
      schema={schema}
      validator={getRjsfValidator()}
      children={<></>}
      formData={props.state}
      formContext={{data: props.state, information: informationRuntimeInfo, defaultService, mode: props.mode || "pageView"}}
      uiSchema={uiSchema}
      className="stateview"
      templates={
        {
          ObjectFieldTemplate,
          ArrayFieldTemplate,
          ...props.templates
        }
      }
      widgets={
        {
          // LinkedRef: LinkedReferenceWidget,
          // TextareaWidget: TextareaWidget,
          // TextWidget: TextWidget,
          ...widgets,
          ...userWidgets
        }
      }
      fields={{
        ...fields,
        ...props.fields
      }}
    />
    <BottomActions sx={{padding:  `${theme.spacing(4)} 0`}} uiOptions={uiOptions} defaultService={defaultService} jexlCtx={jexlCtx} />
  </Box>;
};

export default StateView;
