import {PropsWithChildren, useContext} from "react";
import {
  ArrayFieldTemplateProps,
  canExpand, descriptionId,
  FormContextType, getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema
} from "@rjsf/utils";
import {Box, IconButton, Typography, useTheme} from "@mui/material";
import {
  getContainerGridConfig, getElementGridConfig,
  getNestingLevel,
  getObjPropTitleStyle,
  headingNestingLevel, isDialogMode, isListMode, isPageMode, isWriteMode
} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {names} from "@event-engine/messaging/helpers";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import * as React from "react";
import Grid2, {GridProps as Grid2Props} from "@mui/material/Grid";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTranslation} from "react-i18next";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {FormModeType} from "@frontend/app/components/core/CommandForm";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {Target} from "mdi-material-ui";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {mapFormModeTypeToContainerInfoType, mapFormModeTypeToDropzoneIdTopRight} from "@cody-play/app/utils/mappings";
import {useEnv} from "@frontend/hooks/use-env";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";

export const ArrayFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: PropsWithChildren<ArrayFieldTemplateProps<T,S,F>>) => {
  const theme = useTheme();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();
  const [store] = useGlobalStore();
  const {t} = useTranslation();
  const { liveEditMode } = useContext(LiveEditModeContext);
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();
  const env = useEnv();

  const jexlCtx: FormJexlContext & {value: any[]} = {
    user,
    page:
    pageData,
    routeParams,
    data: props.registry.formContext!.data,
    store,
    mode: props.registry.formContext!.mode,
    value: props.formData as any[]
  };

  const uiSchema = normalizeUiSchema((props.uiSchema as UiSchema) || {}, jexlCtx, env) as UiSchema<T,S,F>;

  const mode: FormModeType = props.registry.formContext!.mode || 'page';

  const nestingLevel = getNestingLevel(props.fieldPathId.$id);
  const headingVariant = headingNestingLevel(props.fieldPathId.$id);

  const title = uiSchema && uiSchema['ui:title'] ? uiSchema['ui:title'] : props.title;
  let fallbackTitle = title;

  if(!fallbackTitle) {
    fallbackTitle = props.title || props.schema.title || '';
  }

  if(uiSchema && uiSchema['ui:widget'] && uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let index = '';
  const match = props.fieldPathId.$id.match(/_(?<index>[\d]+)$/);

  if(match) {
    index = ' ' + (Number(match.groups!['index']) + 1);
  }

  let idPrefix = 'component_' + names(props.title).fileName + '_';
  let fqcn = '';

  if(props.schema.$id) {
    fqcn = playFQCNFromDefinitionId(props.schema.$id);

    idPrefix = 'component_' + names(fqcn).fileName + '_';
  }

  const uiOptions = getUiOptions<T,S,F>(uiSchema);

  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    props.registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    props.registry,
    uiOptions
  );

  const gridConfig = getContainerGridConfig(uiOptions, nestingLevel, theme, mode);

  const {
    ButtonTemplates: { AddButton },
  } = props.registry.templates;

  if(nestingLevel > 1) {
    return <>
      <Grid2 container={true} sx={{width: '100%'}} columns={gridConfig.columns} spacing={gridConfig.spacing}>
        <Grid2 size={'grow'}>
          {!!title && <Typography id={idPrefix + props.fieldPathId.$id} key={props.fieldPathId.$id} variant={headingVariant}
                                  className={(headingVariant === 'h3' || headingVariant === 'h4') ? 'sidebar-anchor' : ''}
                                  sx={ title
                                    ? getObjPropTitleStyle(headingVariant, theme, mode)
                                    : {...getObjPropTitleStyle(headingVariant, theme, mode), color: theme.palette.action.disabled, textDecoration: 'line-through'}}
          >
            {index}{fallbackTitle}
          </Typography>}
          {(uiOptions.description || props.schema.description) && <Box sx={title ? {} : getObjPropTitleStyle(headingVariant, theme, mode)}>
            <ArrayFieldDescriptionTemplate
              fieldPathId={props.fieldPathId}
              description={uiOptions.description || props.schema.description}
              schema={props.schema}
              uiSchema={uiSchema}
              registry={props.registry}
            />
          </Box>}
        </Grid2>
        <TopRightActions uiOptions={uiOptions}
                         containerInfo={undefined}
                         defaultService={props.registry.formContext!.defaultService}
                         jexlCtx={jexlCtx}
                         dropzoneId={undefined}
                         showDropzone={false}
        />
      </Grid2>
      <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
        {!props.items.length && <Grid2 size={12} className={'array-element-wrapper'} key={'array_ele_wrapper_empty'} {...getElementGridConfig(undefined, (uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}>
          <Typography variant="body2" sx={{color: theme => theme.palette.text.disabled}}>- No Entry -</Typography></Grid2> }
        {props.items.map((element, index) => <Grid2 size={12}
          className={'array-element-wrapper'}
          key={'array_ele_wrapper_' + index}
          {...getElementGridConfig(element, (uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}
        >{isWriteMode(mode) ?  <ArrayFieldItemTemplate {...element} /> : element.children }</Grid2>)}
      </Grid2>
      <BottomActions
        sx={{padding: 0}}
        uiOptions={uiOptions}
        containerInfo={undefined}
        defaultService={props.registry.formContext!.defaultService}
        jexlCtx={jexlCtx}
        additionalRightButtons={
          isWriteMode(mode) && props.canAdd ? [
            <AddButton
              key={'array_field_' + props.fieldPathId.$id + 'add_button'}
              className='array-item-add'
              onClick={props.onAddClick}
              disabled={props.disabled || props.readonly}
              uiSchema={uiSchema}
              registry={props.registry}
            />
          ] : undefined
        }/>
    </>
  }

  const isFocusedEle = focusedEle && (focusedEle.type === "stateView" || focusedEle.type === "formView") && focusedEle.id === fqcn;

  return (<>
    <Grid2 container={true} className={'CodyCommandFormContainer'} {...gridConfig}>
      {((isPageMode(mode) && !isListMode(mode))) && <>
        <Grid2 size={'grow'}>
          {(title || liveEditMode) && <Typography id={idPrefix + props.fieldPathId.$id} key={props.fieldPathId.$id} variant={headingVariant}
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
          {(uiOptions.description || props.schema.description) && <Box sx={(title || liveEditMode || isDialogMode(mode)) ? {} : getObjPropTitleStyle(headingVariant, theme, mode)}>
            <ArrayFieldDescriptionTemplate
              fieldPathId={props.fieldPathId}
              description={uiOptions.description || props.schema.description}
              schema={props.schema}
              uiSchema={uiSchema}
              registry={props.registry}
            />
          </Box>}
        </Grid2>
        <Grid2 size={'grow'} sx={{paddingRight: 0, paddingTop: theme.spacing(3)}}>
          <TopRightActions uiOptions={uiOptions}
                           containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
                           defaultService={props.registry.formContext!.defaultService}
                           jexlCtx={jexlCtx}
                           dropzoneId={mapFormModeTypeToDropzoneIdTopRight(mode)}
                           showDropzone={props.registry.formContext!.showDropzone}
          />
        </Grid2>
        </>}
        <Grid2 size={12}>
        {isListMode(mode) && <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
          <Grid2 size={'grow'}>
            {title && <Typography id={idPrefix + props.fieldPathId.$id} key={props.fieldPathId.$id} variant={headingVariant}
                                  sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{index}{title}</Typography>}
          </Grid2>
          <TopRightActions
            uiOptions={uiOptions}
            defaultService={props.registry.formContext!.defaultService}
            jexlCtx={jexlCtx}
            containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
            dropzoneId={mapFormModeTypeToDropzoneIdTopRight(mode)}
            showDropzone={props.registry.formContext!.showDropzone}
          />
        </Grid2>}
        {isDialogMode(mode) && !isListMode(mode) && mode !== 'commandDialogForm' /* Cmd Title + actions is already shown in CommandDialog */ && <Grid2 size={12}>
          <Grid2 size={'grow'}>
            {title && <Typography id={idPrefix + props.fieldPathId.$id} key={props.fieldPathId.$id} variant={headingVariant}
                                  sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{index}{title}</Typography>}
          </Grid2>
          <TopRightActions
            uiOptions={uiOptions}
            defaultService={props.registry.formContext!.defaultService}
            jexlCtx={jexlCtx}
            containerInfo={{name: fqcn, type: mapFormModeTypeToContainerInfoType(mode)}}
            dropzoneId={mapFormModeTypeToDropzoneIdTopRight(mode)}
            showDropzone={props.registry.formContext!.showDropzone}
          />
        </Grid2>}
        {isDialogMode(mode) && (uiOptions.description || props.schema.description) && (
          <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
            <Grid2 size={12}>
              <ArrayFieldDescriptionTemplate
                fieldPathId={props.fieldPathId}
                description={uiOptions.description || props.schema.description}
                schema={props.schema}
                uiSchema={uiSchema}
                registry={props.registry}
              />
            </Grid2>
          </Grid2>
        )}
        <Grid2 container={true} columns={gridConfig.columns} spacing={gridConfig.spacing}>
          {!props.items.length && <Box className={'array-element-wrapper'} key={'array_ele_wrapper_empty'}><Typography variant="body2" sx={{color: theme => theme.palette.text.disabled}}>- No Entry -</Typography></Box> }
          {props.items.map((element, index) => <Grid2 size={12}
            className={'array-element-wrapper'}
            key={'array_ele_wrapper_' + index}
            {...getElementGridConfig(element, (uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}
          >{isWriteMode(mode) ?  <ArrayFieldItemTemplate {...element} /> : element.children }</Grid2>)}
        </Grid2>
      </Grid2>
      <Grid2 container={true} sx={{width: "100%", paddingTop: gridConfig.spacing}} spacing={0}>
        <Grid2 size={12} sx={{padding: 0}}>
          {mode !== "commandDialogForm" && <BottomActions
            sx={{padding: nestingLevel === 1 ? `0 ${theme.spacing(2)}` : 0}}
            containerInfo={nestingLevel === 1 ? {name: fqcn, type: "mixed"} : undefined}
            uiOptions={uiOptions}
            defaultService={props.registry.formContext!.defaultService}
            jexlCtx={jexlCtx} additionalRightButtons={
            isWriteMode(mode) && props.canAdd ? [
              <AddButton
                key={'array_field_' + props.fieldPathId.$id + 'add_button'}
                className='array-item-add'
                onClick={props.onAddClick}
                disabled={props.disabled || props.readonly}
                uiSchema={uiSchema}
                registry={props.registry}
              />
            ] : undefined
          }/>}
        </Grid2>
      </Grid2>
    </Grid2>
  </>)
}
