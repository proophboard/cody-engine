import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
  ObjectFieldTemplatePropertyType, UiSchema, ArrayFieldTemplateItemType, getTemplate, descriptionId, canExpand,
} from '@rjsf/utils';
import Grid2, {Grid2Props} from "@mui/material/Unstable_Grid2";
import {CSSObject, IconButton, SxProps, Theme, Typography, useTheme} from "@mui/material";
import {PropsWithChildren} from "react";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTranslation} from "react-i18next";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {names} from "@event-engine/messaging/helpers";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import * as React from "react";
import {FormModeType} from "@frontend/app/components/core/CommandForm";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";

type HeadingVariant = "h2" | "h3" | "h4" | "h5" | "h6";

export const isWriteMode = (mode: FormModeType): boolean => {
  switch (mode) {
    case "dialogView":
    case "pageView":
      return false;
    default:
      return true;
  }
}

export const isDialogMode = (mode: FormModeType): boolean => {
  switch (mode) {
    case "dialogView":
    case "dialogForm":
    case "commandDialogForm":
      return true;
    default:
      return false;
  }
}

export const isPageMode = (mode: FormModeType): boolean => {
  return !isDialogMode(mode);
}

export const getNestingLevel = (idSchema: string): number => {
  return idSchema.split("_").length;
}

export const headingNestingLevel = (idSchema: string): HeadingVariant => {
  const level = getNestingLevel(idSchema);

  if(level === 1) {
    return "h2";
  }

  if(level === 2) {
    return "h3";
  }

  if(level === 3) {
    return "h4"
  }

  if(level === 4) {
    return "h5"
  }

  return "h6";
}

export const getObjPropTitleStyle = (heading: HeadingVariant, theme: Theme, mode: FormModeType): SxProps => {
  switch (heading) {
    case "h2":
      return {
        padding: theme.spacing(4),
        paddingLeft: isDialogMode(mode) ? theme.spacing(2) : 0,
        paddingRight: isDialogMode(mode) ? theme.spacing(2) : 0
      };
    case "h3":
      return {
        padding: theme.spacing(3),
        paddingLeft: 0
      };
    case "h4":
      return {
        padding: theme.spacing(2),
        paddingLeft: 0
      };
    case "h5":
    case "h6":
      return {
        padding: theme.spacing(1),
        paddingLeft: 0
      }
    default:
      return {}
  }
}

const isObjectFiledTemplatePropertyType = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(element: ObjectFieldTemplatePropertyType | ArrayFieldTemplateItemType<T,S,F>): element is ObjectFieldTemplatePropertyType => {
  return element.hasOwnProperty('name');
}

export const getElementGridConfig = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(element: ObjectFieldTemplatePropertyType | ArrayFieldTemplateItemType<T,S,F>, uiSchema: UiSchema, theme: Theme, nestingLevel: number): object & {xs: number, padding: string} => {
  const elUiSchema = (isObjectFiledTemplatePropertyType(element)? uiSchema[element.name] : uiSchema['items']) || {};
  const elUiOptions = elUiSchema['ui:options'] || {};
  const gridOptions: object & {xs: number, padding: string} = elUiOptions.grid || {};

  if(!gridOptions.xs) {
    gridOptions.xs = 12;
  }

  if(!gridOptions.padding) {
    gridOptions.padding = nestingLevel === 1 ? theme.spacing(2) : `${theme.spacing(2)} 0`;
  }

  return gridOptions;
}

export const getContainerGridConfig = (uiOptions: object & {container?: object}, nestingLevel: number, theme: Theme, mode: FormModeType): object & {spacing: number, border?: string, borderRadius?: number | string} => {
  const gridConfig: object & {style?: CSSObject, spacing?: number, border?: string, borderRadius?: string | number, paddingBottom?: string} = uiOptions.container || {spacing: 2};

  if(!gridConfig.spacing) {
    gridConfig.spacing = 2;
  }

  if(nestingLevel === 1 && isPageMode(mode) && !gridConfig.border) {
    gridConfig.border = `1px solid ${theme.palette.grey["300"]}`;
  }

  if(nestingLevel === 1 && isPageMode(mode) && !gridConfig.borderRadius) {
    gridConfig.borderRadius = Math.round(theme.shape.borderRadius * 0.25)
  }

  if(nestingLevel === 1 && !gridConfig.paddingBottom) {
    gridConfig.paddingBottom = theme.spacing(3);
  }

  return gridConfig as object & {style: CSSObject, spacing: number};
}

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: PropsWithChildren<ObjectFieldTemplateProps<T,S,F>>) {
  const theme = useTheme();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();
  const [store] = useGlobalStore();
  const {t} = useTranslation();

  const uiOptions = getUiOptions<T,S,F>(props.uiSchema);

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    props.registry,
    uiOptions
  );

  const jexlCtx: FormJexlContext = {user, page: pageData, routeParams, data: props.formContext!.data, store};

  const mode: FormModeType = props.formContext!.mode || 'page';

  const nestingLevel = getNestingLevel(props.idSchema.$id);
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  let title = props.uiSchema && props.uiSchema['ui:title'] ? props.uiSchema['ui:title'] : props.title;

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let index = '';
  const match = props.idSchema.$id.match(/_(?<index>[\d]+)$/);

  if(match) {
    index = ''+(Number(match.groups!['index']) + 1);
    title = title.replace(`-${index}`, '');
    index = `${index}. `;
  }

  let idPrefix = 'component_' + names(props.title).fileName + '_';
  let fqcn = '';

  if(props.schema.$id) {
    fqcn = playFQCNFromDefinitionId(props.schema.$id);

    idPrefix = 'component_' + names(fqcn).fileName + '_';
  }

  const gridConfig = getContainerGridConfig(uiOptions, nestingLevel, theme, mode);

  const {
    ButtonTemplates: { AddButton },
  } = props.registry.templates;

  return (<>
    <Grid2 container={nestingLevel === 1} className={nestingLevel === 1 ? 'CodyCommandFormContainer' : ''}>
      {(isPageMode(mode) || nestingLevel > 1) && <Grid2 xs={12}>
        <Grid2 xs>
          {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                                className={(headingVariant === 'h3' || headingVariant === 'h4') ? 'sidebar-anchor' : ''}
                                sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{index}{title}</Typography>}
          {props.description && <DescriptionFieldTemplate
            id={descriptionId<T>(props.idSchema)}
            description={props.description}
            schema={props.schema}
            uiSchema={props.uiSchema}
            registry={props.registry}
          />}
        </Grid2>
        <TopRightActions uiOptions={uiOptions}
                         containerInfo={nestingLevel === 1 ? {name: fqcn, type: "mixed"} : undefined}
                         defaultService={props.formContext!.defaultService}
                         jexlCtx={jexlCtx}/>
      </Grid2>}
      <Grid2 xs={12} {...gridConfig as Grid2Props}>
        {isDialogMode(mode) && mode !== 'commandDialogForm' /* Cmd Title + actions is already shown in CommandDialog */ && nestingLevel === 1 && <Grid2 xs={12}>
          <Grid2 xs>
            {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                         sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{index}{title}</Typography>}
          </Grid2>
          <TopRightActions uiOptions={uiOptions} defaultService={props.formContext!.defaultService} jexlCtx={jexlCtx}/>
        </Grid2>}
        {isDialogMode(mode) && nestingLevel === 1 && props.description && (
          <Grid2 xs={12} sx={{paddingLeft: theme.spacing(2)}}>
            <DescriptionFieldTemplate
              id={descriptionId<T>(props.idSchema)}
              description={props.description}
              schema={props.schema}
              uiSchema={props.uiSchema}
              registry={props.registry}
            />
          </Grid2>
        )}
        {props.properties.map(
          element =>
            element.hidden ? (
                element.content
              ) :
              <Grid2 component="div" key={'ele_wrapper_' + element.name} {...getElementGridConfig(element, (props.uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}>{element.content}</Grid2>)
        }
      </Grid2>
      {isPageMode(mode) && isWriteMode(mode) && nestingLevel === 1 &&  canExpand<T, S, F>(props.schema, props.uiSchema, props.formData) && <Grid2 container justifyContent='flex-end'>
        <Grid2>
          <AddButton
            className='object-property-expand'
            onClick={props.onAddClick(props.schema)}
            disabled={props.disabled || props.readonly}
            uiSchema={props.uiSchema}
            registry={props.registry}
          />
        </Grid2>
      </Grid2>}
    </Grid2>
    {(isDialogMode(mode) || nestingLevel > 1) && <BottomActions
      sx={{padding: nestingLevel === 1 ? `0 ${theme.spacing(2)}` : 0}}
      uiOptions={uiOptions}
      containerInfo={nestingLevel === 1 ? {name: fqcn, type: "mixed"} : undefined}
      defaultService={props.formContext!.defaultService}
      jexlCtx={jexlCtx}
      additionalRightButtons={
        isWriteMode(mode) && canExpand<T, S, F>(props.schema, props.uiSchema, props.formData) ? [
          <AddButton
            className='object-property-expand'
            key={'object_field_' + props.idSchema.$id + '_object_property_expand'}
            onClick={props.onAddClick(props.schema)}
            disabled={props.disabled || props.readonly}
            uiSchema={props.uiSchema}
            registry={props.registry}
          />
        ] : undefined
    }/>}
  </>)
}
