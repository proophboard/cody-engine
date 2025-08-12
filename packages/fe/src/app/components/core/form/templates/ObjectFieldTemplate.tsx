import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
  ObjectFieldTemplatePropertyType, UiSchema, ArrayFieldTemplateItemType, getTemplate, descriptionId, canExpand,
} from '@rjsf/utils';
import Grid2, {Grid2Props} from "@mui/material/Unstable_Grid2";
import {Box, CSSObject, IconButton, Stack, SxProps, Theme, Typography, useTheme} from "@mui/material";
import {PropsWithChildren, useContext} from "react";
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
import {ActionContainerInfo, ActionContainerInfoType} from "@frontend/app/components/core/form/types/action";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {mapFormModeTypeToContainerInfoType, mapFormModeTypeToDropzoneIdTopRight} from "@cody-play/app/utils/mappings";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {informationTitle} from "@frontend/util/information/titelize";
import {Target} from "mdi-material-ui";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {EDropzoneId} from "@cody-play/app/types/enums/EDropzoneId";

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

export const isListMode = (mode: FormModeType): boolean => {
  return mode === "listView";
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
>(element: ObjectFieldTemplatePropertyType | ArrayFieldTemplateItemType<T,S,F> | undefined, uiSchema: UiSchema, theme: Theme, nestingLevel: number): object & {xs: number, padding: string} => {
  const elUiSchema = (element && isObjectFiledTemplatePropertyType(element)? uiSchema[element.name] : uiSchema['items']) || {};
  const elUiOptions = elUiSchema['ui:options'] || {};
  const gridOptions: object & {xs: number, padding: string} = elUiOptions.grid || {};

  if(!gridOptions.xs) {
    gridOptions.xs = 12;
  }

  return gridOptions;
}

export const getContainerGridConfig = (uiOptions: object & {container?: object}, nestingLevel: number, theme: Theme, mode: FormModeType): object & {spacing: number, columns: number, border?: string, borderRadius?: number | string} => {
  const gridConfig: object & {style?: CSSObject, spacing?: number, columns?: number, border?: string, borderRadius?: string | number, paddingBottom?: string} = uiOptions.container || {spacing: 2};

  if(!gridConfig.spacing) {
    gridConfig.spacing = 2;
  }

  if(!gridConfig.columns) {
    gridConfig.columns = 12;
  }

  if(nestingLevel === 1 && !gridConfig.paddingBottom) {
    gridConfig.paddingBottom = theme.spacing(3);
  }

  return gridConfig as object & {style: CSSObject, spacing: number, columns: number};
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
  const { liveEditMode } = useContext(LiveEditModeContext);
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();

  const uiOptions = getUiOptions<T,S,F>(props.uiSchema);

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    props.registry,
    uiOptions
  );

  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    routeParams,
    data: props.formContext!.data,
    store,
    mode: props.formContext!.mode,
  };

  const mode: FormModeType = props.formContext!.mode || 'page';

  const nestingLevel = getNestingLevel(props.idSchema.$id);
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  let title = props.uiSchema && props.uiSchema['ui:title'] ? props.uiSchema['ui:title'] : props.title;
  let fallbackTitle = title;

  if(!fallbackTitle) {
    fallbackTitle = props.title || props.schema.title || '';
  }

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

  const isFocusedEle = focusedEle && (focusedEle.type === "stateView" || focusedEle.type === "formView") && focusedEle.id === fqcn;

  if(nestingLevel > 1) {
    return <>
      <Grid2 container={true} sx={{width: '100%'}} columns={gridConfig.columns} spacing={gridConfig.spacing}>
        <Grid2 xs>
          {!!title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
            className={(headingVariant === 'h3' || headingVariant === 'h4') ? 'sidebar-anchor' : ''}
            sx={ title
              ? getObjPropTitleStyle(headingVariant, theme, mode)
              : {...getObjPropTitleStyle(headingVariant, theme, mode), color: theme.palette.action.disabled, textDecoration: 'line-through'}}
          >
            {index}{fallbackTitle}
          </Typography>}
          {props.description && <Box sx={title ? {} : getObjPropTitleStyle(headingVariant, theme, mode)}>
            <DescriptionFieldTemplate
            id={descriptionId<T>(props.idSchema)}
            description={props.description}
            schema={props.schema}
            uiSchema={props.uiSchema}
            registry={props.registry}
            />
          </Box>}
        </Grid2>
        <TopRightActions uiOptions={uiOptions}
                         containerInfo={undefined}
                         defaultService={props.formContext!.defaultService}
                         jexlCtx={jexlCtx}
                         dropzoneId={undefined}
                         showDropzone={false}
        />
      </Grid2>
      <Grid2 container={true} columns={gridConfig.columns || 12} spacing={gridConfig.spacing}>
        {props.properties.map(
          element =>
            element.hidden ? (
                element.content
              ) :
              <Grid2 component="div" key={'ele_wrapper_' + element.name} {...getElementGridConfig(element, (props.uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}>{element.content}</Grid2>)
        }
      </Grid2>
      <BottomActions
        sx={{padding: 0}}
        uiOptions={uiOptions}
        containerInfo={undefined}
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
        }/>
    </>
  }

  // nestingLevel === 1

  return (<>
    <Grid2 container={true} className={'CodyCommandFormContainer'} {...gridConfig}>
      {isPageMode(mode) && <>
        <Grid2 xs>
          {(title || liveEditMode) && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                                className={(headingVariant === 'h3' || headingVariant === 'h4') ? 'sidebar-anchor' : ''}
                                sx={ title
                                  ? getObjPropTitleStyle(headingVariant, theme, mode)
                                  : {...getObjPropTitleStyle(headingVariant, theme, mode), color: theme.palette.action.disabled, textDecoration: 'line-through'}}
          >
            {index}{fallbackTitle}
            {liveEditMode && <IconButton onClick={() => setFocusedEle({
              id: fqcn,
              name: fallbackTitle,
              type: isWriteMode(mode) ? 'formView' : 'stateView',
            })} color={isFocusedEle ? 'info' : undefined}><Target /></IconButton>}
          </Typography>}
          {props.description && <Box sx={(title || liveEditMode || isDialogMode(mode)) ? {} : getObjPropTitleStyle(headingVariant, theme, mode)}>
            <DescriptionFieldTemplate
            id={descriptionId<T>(props.idSchema)}
            description={props.description}
            schema={props.schema}
            uiSchema={props.uiSchema}
            registry={props.registry}
            />
          </Box>}
        </Grid2>
        <Grid2 xs sx={{paddingRight: 0, paddingTop: theme.spacing(3)}}>
          <TopRightActions uiOptions={uiOptions}
                           containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
                           defaultService={props.formContext!.defaultService}
                           jexlCtx={jexlCtx}
                           dropzoneId={mapFormModeTypeToDropzoneIdTopRight(mode)}
                           showDropzone={props.formContext!.showDropzone}
          />
        </Grid2>
      </>}
      <Grid2 xs={12}>
        {isDialogMode(mode) && !isListMode(mode) && mode !== 'commandDialogForm' /* Cmd Title + actions is already shown in CommandDialog */ && <Grid2 xs={12}>
          <Grid2 xs>
            {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                         sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{index}{title}</Typography>}
          </Grid2>
          <TopRightActions
            uiOptions={uiOptions}
            defaultService={props.formContext!.defaultService}
            jexlCtx={jexlCtx}
            containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
            dropzoneId={mapFormModeTypeToDropzoneIdTopRight(mode)}
            showDropzone={props.formContext!.showDropzone}
          />
        </Grid2>}
        {isDialogMode(mode) && props.description && (
          <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
            <Grid2 xs={12}>
              <DescriptionFieldTemplate
                id={descriptionId<T>(props.idSchema)}
                description={props.description}
                schema={props.schema}
                uiSchema={props.uiSchema}
                registry={props.registry}
              />
            </Grid2>
          </Grid2>
        )}
        <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
          {props.properties.map(
            element =>
              element.hidden ? (
                  element.content
                ) :
                <Grid2 component="div" key={'ele_wrapper_' + element.name} {...getElementGridConfig(element, (props.uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}>{element.content}</Grid2>)
          }
        </Grid2>
      </Grid2>
      <Grid2 container={true} sx={{width: "100%", paddingTop: gridConfig.spacing}} spacing={0}>
        <Grid2 xs={12} sx={{padding: 0}}>
          {mode !== "commandDialogForm" && <BottomActions
            uiOptions={uiOptions}
            containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
            dropzoneId={{
              left: EDropzoneId.VIEW_BOTTOM_ACTIONS_LEFT,
              center: EDropzoneId.VIEW_BOTTOM_ACTIONS_CENTER,
              right: EDropzoneId.VIEW_BOTTOM_ACTIONS_RIGHT,
            }}
            showDropzone={props.formContext!.showDropzone ? {left: true, center: true, right: true} : undefined}
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
        </Grid2>
      </Grid2>
    </Grid2>
  </>)
}
