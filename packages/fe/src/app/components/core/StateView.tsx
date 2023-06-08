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
import validator from '@rjsf/validator-ajv8';
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";

interface OwnProps {
  state?: Record<string, any>;
  description: ValueObjectRuntimeInfo;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  objectFieldTemplate?: React.FunctionComponent<ObjectFieldTemplateProps>;
  arrayFieldTemplate?: React.FunctionComponent<ArrayFieldTemplateProps>;
  fieldTemplate?: React.FunctionComponent<FieldTemplateProps>;
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
    <Typography id={props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant} className="sidebar-anchor" sx={getObjPropTitleStyle(headingVariant)}>{props.title}{index}</Typography>
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
    <Typography id={props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant} className="sidebar-anchor" sx={getObjPropTitleStyle(headingVariant)}>{props.title}</Typography>
    {props.items.map((element, index) => <Box className={'array-element-wrapper'} key={'array_ele_wrapper_' + index}>{element.children}</Box>)}
  </div>
    ;
}

const StateView = (props: StateViewProps) => {
  const theme = useTheme();
  const uiSchema = props.description.uiSchema? {"ui:readonly": true, ...props.description.uiSchema} : {"ui:readonly": true};

  const widgets = props.widgets || {};

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [props.state]);

  return <Card>
          <CardContent sx={theme.stateView.styleOverrides}>
              <Form
                  schema={props.description.schema as RJSFSchema}
                  validator={validator}
                  children={<></>}
                  formData={props.state}
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
                      ...widgets
                    }
                  }
                  fields={props.fields}
              />
          </CardContent>
        </Card>;
};

export default StateView;
