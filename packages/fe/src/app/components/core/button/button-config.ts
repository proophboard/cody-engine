import {SxProps} from "@mui/material";
import * as React from "react";

export interface ButtonConfig {
  variant?: "text" | "outlined" | "contained",
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'default',
  disabled?: boolean,
  style?: SxProps,
  hidden?: boolean,
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
  /* DataGrid specific config */
  asGridActionsCellItem?: boolean;
  showInMenu?: boolean;
}
