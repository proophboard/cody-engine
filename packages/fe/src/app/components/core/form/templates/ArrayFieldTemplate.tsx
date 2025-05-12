import {PropsWithChildren} from "react";
import {
  ArrayFieldTemplateProps,
  canExpand,
  FormContextType, getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema
} from "@rjsf/utils";
import {Box, Typography, useTheme} from "@mui/material";
import {
  getContainerGridConfig, getElementGridConfig,
  getNestingLevel,
  getObjPropTitleStyle,
  headingNestingLevel, isDialogMode, isPageMode, isWriteMode
} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {names} from "@event-engine/messaging/helpers";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import * as React from "react";
import Grid2, {Grid2Props} from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTranslation} from "react-i18next";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {FormModeType} from "@frontend/app/components/core/CommandForm";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";

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

  const jexlCtx: FormJexlContext = {user, page: pageData, routeParams, data: props.formContext!.data, store};

  const mode: FormModeType = props.formContext!.mode || 'page';

  const nestingLevel = getNestingLevel(props.idSchema.$id);
  const headingVariant = headingNestingLevel(props.idSchema.$id);

  const title = props.uiSchema && props.uiSchema['ui:title'] ? props.uiSchema['ui:title'] : props.title;

  if(props.uiSchema && props.uiSchema['ui:widget'] && props.uiSchema['ui:widget'] === 'hidden') {
    return <></>
  }

  let index = '';
  const match = props.idSchema.$id.match(/_(?<index>[\d]+)$/);

  if(match) {
    index = ' ' + (Number(match.groups!['index']) + 1);
  }

  let idPrefix = 'component_' + names(props.title).fileName + '_';
  let fqcn = '';

  if(props.schema.$id) {
    fqcn = playFQCNFromDefinitionId(props.schema.$id);

    idPrefix = 'component_' + names(fqcn).fileName + '_';
  }

  const uiOptions = getUiOptions<T,S,F>(props.uiSchema);

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

  return (<>
    <Grid2 container={nestingLevel === 1} className={nestingLevel === 1 ? 'CodyCommandFormContainer' : ''}>
      <Grid2 xs={12}>
        <Grid2 xs>
          {title && <Typography id={idPrefix + props.idSchema.$id} key={props.idSchema.$id} variant={headingVariant}
                                className={(headingVariant === 'h3' || headingVariant === 'h4') ? 'sidebar-anchor' : ''}
                                sx={getObjPropTitleStyle(headingVariant, theme, mode)}>{title}{index}</Typography>}
        </Grid2>
        <TopRightActions  uiOptions={uiOptions}
                          containerInfo={nestingLevel === 1 ? {name: fqcn, type: "mixed"} : undefined}
                          defaultService={props.formContext!.defaultService}
                          jexlCtx={jexlCtx}
        />
      </Grid2>
      <Grid2 xs={12} {...gridConfig as Grid2Props}>
        <ArrayFieldDescriptionTemplate
          idSchema={props.idSchema}
          description={uiOptions.description || props.schema.description}
          schema={props.schema}
          uiSchema={props.uiSchema}
          registry={props.registry}
        />
        {!props.items.length && <Box className={'array-element-wrapper'} key={'array_ele_wrapper_empty'}><Typography variant="body2" sx={{color: theme => theme.palette.text.disabled}}>- No Entry -</Typography></Box> }
        {props.items.map((element, index) => <Box
          className={'array-element-wrapper'}
          key={'array_ele_wrapper_' + index}
          {...getElementGridConfig(element, (props.uiSchema || {}) as UiSchema, theme, nestingLevel) as Grid2Props}
        >{isWriteMode(mode) ?  <ArrayFieldItemTemplate {...element} /> : element.children }</Box>)}
      </Grid2>
      {isPageMode(mode) && isWriteMode(mode) && nestingLevel === 1 && props.canAdd && <Grid2 container justifyContent='flex-end'>
        <Grid2>
          <AddButton
            className='array-item-add'
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
            uiSchema={props.uiSchema}
            registry={props.registry}
          />
        </Grid2>
      </Grid2>}
    </Grid2>
    {(isDialogMode(mode) || nestingLevel > 1) && <BottomActions
      sx={{padding: nestingLevel === 1 ? `0 ${theme.spacing(2)}` : 0}}
      containerInfo={nestingLevel === 1 ? {name: fqcn, type: "mixed"} : undefined}
      uiOptions={uiOptions}
      defaultService={props.formContext!.defaultService}
      jexlCtx={jexlCtx} additionalRightButtons={
        isWriteMode(mode) && props.canAdd ? [
          <AddButton
            key={'array_field_' + props.idSchema.$id + 'add_button'}
            className='array-item-add'
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
            uiSchema={props.uiSchema}
            registry={props.registry}
          />
        ] : undefined
    }/>}
  </>)
}
