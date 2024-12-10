import * as React from 'react';
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {
  ArrayFieldTemplateProps,
  Field,
  FieldTemplateProps, getUiOptions,
  ObjectFieldTemplateProps,
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
import {names} from "@event-engine/messaging/helpers";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import Grid2, {Grid2Props} from "@mui/material/Unstable_Grid2";
import {
  getContainerGridConfig,
  getElementGridConfig
} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {usePageData} from "@frontend/hooks/use-page-data";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {useParams} from "react-router-dom";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {merge} from "lodash";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTypes} from "@frontend/hooks/use-types";
import {useTranslation} from "react-i18next";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";
import {translateSchema} from "@frontend/util/schema/translate-schema";

interface OwnProps {
  state?: any;
  description: ValueObjectRuntimeInfo;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  templates?: {[name: string]: React.FunctionComponent<any>};
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
  hidden?: boolean;
}

type StateViewProps = OwnProps;

type HeadingVariant = "h2" | "h3" | "h4" | "h5";

export const headingNestingLevel = (idSchema: string): HeadingVariant => {
  const level = idSchema.split("_").length + 1;

  if(level === 1) {
    return "h2";
  }

  if(level > 5) {
    return "h5";
  }

  return "h"+level as HeadingVariant;
}

export const getObjPropTitleStyle = (heading: HeadingVariant): SxProps => {
  switch (heading) {
    case "h2":
      return {
        paddingTop: '40px',
        paddingBottom: '40px',
      };
    case "h3":
      return {
        paddingTop: '30px',
        paddingBottom: '30px',
      };
    case "h4":
      return {
        paddingTop: '20px',
        paddingBottom: '20px',
      };
    case "h5":
      return {
        paddingTop: '10px',
        paddingBottom: '10px',
      };
  }
}

export const ObjectFieldTemplate = (props: PropsWithChildren<ObjectFieldTemplateProps>) => {
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();
  const [store] = useGlobalStore();
  const {t} = useTranslation();

  const jexlCtx: FormJexlContext = {user, page: pageData, routeParams, data: props.formContext.data, store};

  const headingVariant = headingNestingLevel(props.idSchema.$id);

  const title = props.uiSchema? props.uiSchema['ui:title'] : props.title;

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let index = '';
  const match = props.idSchema.$id.match(/_(?<index>[\d]+)$/);

  if(match) {
    index = ' ' + (Number(match.groups!['index']) + 1);
  }

  let idPrefix = 'component_' + names(props.title).fileName + '_';

  if(props.schema.$id) {
    const fqcn = playFQCNFromDefinitionId(props.schema.$id);

    idPrefix = 'component_' + names(fqcn).fileName + '_';
  }

  const uiOptions = getUiOptions(props.uiSchema);
  const gridConfig = getContainerGridConfig(uiOptions);

  return <div>
    <Grid2 container>
      <Grid2 xs>
        {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                                    className={(headingVariant === 'h2' || headingVariant === 'h3') ? 'sidebar-anchor' : ''}
                                    sx={getObjPropTitleStyle(headingVariant)}>{title}{index}</Typography>}
      </Grid2>
      <TopRightActions  uiOptions={uiOptions} defaultService={props.formContext.defaultService} jexlCtx={jexlCtx} />
    </Grid2>
    {props.description}
    <Grid2 container={true} {...gridConfig as Grid2Props}>
      {props.properties.map(
        element =>
          element.hidden ? (
              element.content
            ) :
            <Grid2 component="div" key={'ele_wrapper_' + element.name} {...getElementGridConfig(element, (props.uiSchema || {}) as UiSchema) as Grid2Props}>{element.content}</Grid2>)
      }
    </Grid2>
  </div>
}

export const ArrayFieldTemplate = (props: PropsWithChildren<ArrayFieldTemplateProps>) => {
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let idPrefix = 'component_' + names(props.title).fileName + '_';

  const title = props.uiSchema? props.uiSchema['ui:title'] : props.title;

  if(props.schema.$id) {
    const fqcn = playFQCNFromDefinitionId(props.schema.$id);

    idPrefix = 'component_' + names(fqcn).fileName + '_';
  }

  return <div>
    {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                                className={(headingVariant === 'h2' || headingVariant === 'h3') ? 'sidebar-anchor' : ''}
                                sx={getObjPropTitleStyle(headingVariant)}>{title}</Typography>}
    {!props.items.length && <Box className={'array-element-wrapper'} key={'array_ele_wrapper_empty'}><Typography variant="body2" sx={{color: theme => theme.palette.text.disabled}}>- No Entry -</Typography></Box> }
    {props.items.map((element, index) => <Box className={'array-element-wrapper'} key={'array_ele_wrapper_' + index}>{element.children}</Box>)}
  </div>
    ;
}

const StateView = (props: StateViewProps) => {
  const theme = useTheme();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [types] = useTypes();
  const routeParams = useParams();
  const [globalStore] = useGlobalStore();
  const {t} = useTranslation();
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
      ...normalizeUiSchema(mergedUiSchema, jexlCtx)
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

  return <>
    <Card>
      <CardContent sx={theme.stateView.styleOverrides}>
        <Form
          schema={schema}
          validator={getRjsfValidator()}
          children={<></>}
          formData={props.state}
          formContext={{data: props.state, information: informationRuntimeInfo, defaultService}}
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
      </CardContent>
    </Card>
    <BottomActions uiOptions={uiOptions} defaultService={defaultService} jexlCtx={jexlCtx} />
  </>;
};

export default StateView;
