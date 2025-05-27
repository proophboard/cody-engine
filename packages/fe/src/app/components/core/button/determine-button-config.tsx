import {SxProps} from "@mui/material";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {UiSchema} from "@rjsf/utils";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import * as React from "react";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";

export interface ButtonProps {
  label?: string;
  startIcon?: React.ReactNode | false | string | undefined;
  endIcon?: React.ReactNode | string | undefined;
  icon?: React.ReactNode | false | string | undefined;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'default';
  style?: SxProps;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "text" | "outlined" | "contained";
  'variant:expr'?: string,
  'color:expr'?: string,
  'disabled:expr'?: string,
  'style:expr'?: string,
  'hidden:expr'?: string,
  'icon:expr'?: string,
  'label:expr'?: string,
  'endIcon:expr'?: string,
  /* DataGrid specific config */
  asGridActionsCellItem?: boolean;
  showInMenu?: boolean;
}

const makeIcon = (icon: React.ReactNode | string | undefined): React.ReactNode | undefined => {
  return typeof icon === "string" ? <MdiIcon icon={icon} /> : icon;
}

export const determineButtonConfig = (props: ButtonProps, uiSchema: UiSchema, jexlCtx: FormJexlContext | TableRowJexlContext, env: RuntimeEnvironment): ButtonConfig => {
  const uiButtonConfig = uiSchema['ui:button'] ? normalizeUiSchema(uiSchema['ui:button'], jexlCtx, env) : {};

  // MdiIcons cannot be deep-cloned, therefor we need to remove them before passing props to normalizeUiSchema
  let propsCopy = {...props};
  delete propsCopy.startIcon;
  delete propsCopy.icon;
  delete propsCopy.endIcon;

  propsCopy = normalizeUiSchema(propsCopy as unknown as UiSchema, jexlCtx, env) as ButtonProps;
  props = {...props, ...propsCopy};

  let uiConfigIcon;
  let endIcon = props.endIcon;

  if(uiButtonConfig['variantExpr']) {
    uiButtonConfig['variant'] = jexl.evalSync(uiButtonConfig['variantExpr'], jexlCtx);
  }

  if(uiButtonConfig['colorExpr']) {
    uiButtonConfig['color'] = jexl.evalSync(uiButtonConfig['colorExpr'], jexlCtx);
  }

  if(uiButtonConfig['styleExpr']) {
    uiButtonConfig['style'] = jexl.evalSync(uiButtonConfig['styleExpr'], jexlCtx);
  }

  if(uiButtonConfig['icon:expr']) {
    uiButtonConfig['icon'] = jexl.evalSync(uiButtonConfig['icon:expr'], jexlCtx);
  }

  // @TODO: Fix that uiSchema is altered
  if(uiButtonConfig['icon']) {
    uiConfigIcon = typeof uiButtonConfig['icon'] === "string" ? <MdiIcon icon={uiButtonConfig['icon']} /> : uiButtonConfig['icon'];
  }

  if(uiButtonConfig['endIcon'] && !endIcon) {
    endIcon = typeof uiButtonConfig['endIcon'] === "string" ? <MdiIcon icon={uiButtonConfig['endIcon']} /> : uiButtonConfig['endIcon'];
  }

  const variant = props.variant || uiButtonConfig['variant'] || 'contained';
  const color = props.color || uiButtonConfig['color'] || 'primary';
  const style = props.style || uiButtonConfig['style'] || undefined;
  const icon = props.startIcon === false ? undefined : props.startIcon || props.icon || uiConfigIcon;
  const label = props.label || (!props.icon && !props["icon:expr"] ? uiButtonConfig['label'] : undefined) || undefined;

  let disabled: boolean | undefined = undefined;

  if(typeof props.disabled !== "undefined") {
    disabled = props.disabled;
  } else if (typeof uiButtonConfig['disabled'] !== "undefined") {
    const btnCDisabled = uiButtonConfig['disabled'];

    if(typeof btnCDisabled === "boolean") {
      disabled = btnCDisabled;
    }

    if(typeof btnCDisabled === "string") {
      disabled = jexl.evalSync(btnCDisabled, jexlCtx);
    }
  }

  let hidden: boolean | undefined = undefined;

  if(typeof props.hidden !== "undefined") {
    hidden = props.hidden;
  } else if (typeof uiButtonConfig['hidden'] !== "undefined") {
    const btnCHidden = uiButtonConfig['hidden'];

    if(typeof btnCHidden === "boolean") {
      hidden = btnCHidden;
    }

    if(typeof btnCHidden === "string") {
      hidden = jexl.evalSync(btnCHidden, jexlCtx);
    }
  }

  return {
    variant,
    color,
    style,
    disabled,
    hidden,
    icon: makeIcon(icon),
    label,
    endIcon: makeIcon(endIcon),
    asGridActionsCellItem: props.asGridActionsCellItem,
    showInMenu: props.showInMenu,
  }
}
