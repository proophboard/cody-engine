import * as React from 'react';
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {
  ArrayFieldTemplateProps,
  Field,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  Widget
} from "@rjsf/utils";
import {Box, Card, CardContent, CircularProgress, SxProps, Typography, useTheme} from "@mui/material";
import {PropsWithChildren, useEffect} from "react";
import {Form} from "@rjsf/mui";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {widgets} from "@frontend/app/components/core/form/widgets";
import {fields} from "@frontend/app/components/core/form/fields";
import {cloneSchema, resolveRefs, resolveUiSchema} from "@event-engine/messaging/resolve-refs";
import definitions from "@app/shared/types/definitions";
import {useUser} from "@frontend/hooks/use-user";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {types} from "@app/shared/types";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";

interface OwnProps {
  state?: Record<string, any>;
  description: ValueObjectRuntimeInfo;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  objectFieldTemplate?: React.FunctionComponent<ObjectFieldTemplateProps>;
  arrayFieldTemplate?: React.FunctionComponent<ArrayFieldTemplateProps>;
  fieldTemplate?: React.FunctionComponent<FieldTemplateProps>;
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
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
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let index = '';
  const match = props.idSchema.$id.match(/_(?<index>[\d]+)$/);

  if(match) {
    index = ' ' + (Number(match.groups!['index']) + 1);
  }

  return <div>
    <Typography id={props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant} className={(headingVariant === 'h2' || headingVariant === 'h3')? 'sidebar-anchor' : ''} sx={getObjPropTitleStyle(headingVariant)}>{props.title}{index}</Typography>
    {props.description}
    {props.properties.map(element => <Box component="div" key={'ele_wrapper_' + element.name} sx={{marginBottom: '10px'}}>{element.content}</Box>)}
  </div>
}

export const ArrayFieldTemplate = (props: PropsWithChildren<ArrayFieldTemplateProps>) => {
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  return <div>
    <Typography id={props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant} className={(headingVariant === 'h2' || headingVariant === 'h3')? 'sidebar-anchor' : ''} sx={getObjPropTitleStyle(headingVariant)}>{props.title}</Typography>
    {!props.items.length && <Box className={'array-element-wrapper'} key={'array_ele_wrapper_empty'}><Typography variant="body2" sx={{color: theme => theme.palette.text.disabled}}>- No Entry -</Typography></Box> }
    {props.items.map((element, index) => <Box className={'array-element-wrapper'} key={'array_ele_wrapper_' + index}>{element.children}</Box>)}
  </div>
    ;
}

const StateView = (props: StateViewProps) => {
  const theme = useTheme();
  const [user,] = useUser();
  const [pageData,] = useUser();

  const resolvedUiSchema = resolveUiSchema(props.description.schema as any, types);
  const mainUiSchema = props.description.uiSchema;
  const mergedUiSchema = {...resolvedUiSchema, ...mainUiSchema};
  const uiSchema = Object.keys(mergedUiSchema).length > 0
    ? {
      "ui:readonly": true,
      ...normalizeUiSchema(mergedUiSchema, {form: props.state, user, page: pageData})
    }
    : {"ui:readonly": true};

  const userWidgets = props.widgets || {};

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [props.state]);

  const schema = resolveRefs(cloneSchema(props.description.schema as any), props.definitions || definitions) as RJSFSchema;

  return <Card>
    <CardContent sx={theme.stateView.styleOverrides}>
      <Form
        schema={schema}
        validator={getRjsfValidator()}
        children={<></>}
        formData={props.state}
        formContext={{data: props.state}}
        uiSchema={uiSchema}
        className="stateview"
        templates={
          {
            ObjectFieldTemplate: props.objectFieldTemplate || ObjectFieldTemplate,
            ArrayFieldTemplate: props.arrayFieldTemplate || ArrayFieldTemplate,
            ...(props.fieldTemplate ? {FieldTemplate: props.fieldTemplate} : {})
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
  </Card>;
};

export default StateView;
