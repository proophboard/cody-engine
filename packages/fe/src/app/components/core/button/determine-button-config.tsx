import {SxProps} from "@mui/material";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {UiSchema} from "@rjsf/utils";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import * as React from "react";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";

export interface ButtonProps {
  label?: string;
  startIcon?: React.ReactNode | undefined;
  endIcon?: React.ReactNode | undefined;
  buttonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | undefined;
  style?: SxProps;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "text" | "outlined" | "contained";
}

export interface ButtonConfig {
  variant: "text" | "outlined" | "contained",
  color: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
  disabled: boolean,
  style: SxProps,
  hidden: boolean,
  icon?: React.ReactNode,
  label?: string,
  endIcon?: React.ReactNode,
  'variant:expr'?: string,
  'color:expr'?: string,
  'disabled:expr'?: string,
  'style:expr'?: string,
  'hidden:expr'?: string,
  'icon:expr'?: string,
  'label:expr'?: string,
  'endIcon:expr'?: string,
}

export const determineButtonConfig = (props: ButtonProps, uiSchema: UiSchema, jexlCtx: FormJexlContext): ButtonConfig => {
  const uiButtonConfig = uiSchema['ui:button'] || {};

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

  // @TODO: Fix that uiSchema is altered
  if(uiButtonConfig['icon']) {
    uiConfigIcon = typeof uiButtonConfig['icon'] === "string" ? <MdiIcon icon={uiButtonConfig['icon']} /> : uiButtonConfig['icon'];
  }

  if(uiButtonConfig['endIcon'] && !endIcon) {
    endIcon = typeof uiButtonConfig['endIcon'] === "string" ? <MdiIcon icon={uiButtonConfig['endIcon']} /> : uiButtonConfig['endIcon'];
  }

  const variant = props.variant || uiButtonConfig['variant'] || 'contained';
  const color = props.buttonColor || uiButtonConfig['color'] || 'primary';
  const style = props.style || uiButtonConfig['style'] || undefined;
  const icon = props.startIcon || uiConfigIcon;
  const label = props.label || uiButtonConfig['label'] || undefined;

  let disabled = false;

  if(props.disabled) {
    disabled = true;
  } else if (uiButtonConfig['disabled']) {
    const btnCDisabled = uiButtonConfig['disabled'];

    if(typeof btnCDisabled === "boolean") {
      disabled = btnCDisabled;
    }

    if(typeof btnCDisabled === "string") {
      disabled = jexl.evalSync(btnCDisabled, jexlCtx);
    }
  }

  let hidden = false;

  if(props.hidden) {
    hidden = true;
  } else if (uiButtonConfig['hidden']) {
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
    icon,
    label,
    endIcon
  }
}
