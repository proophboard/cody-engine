import { ChangeEvent, FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {MenuItem, TextField, TextFieldProps} from "@mui/material";

// Copied from: https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/material-ui/src/SelectWidget/SelectWidget.tsx
// and modified to use useApiQuery and turn result into select options

export default function DataSelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
  >({
      schema,
      id,
      options,
      label,
      hideLabel,
      required,
      disabled,
      readonly,
      placeholder,
      value,
      multiple,
      autofocus,
      onChange,
      onBlur,
      onFocus,
      rawErrors = [],
      registry,
      uiSchema,
      hideError,
      formContext,
      ...textFieldProps
    }: WidgetProps<T, S, F>) {

  // @TODO: Make sure that uiSchema is passed to CommandForm and StateView
  // @TODO: Fetch data using useApiQuery
  // @TODO: Inject "loading..." option with empty value while query is loading
  // @TODO: use jexl to get label and value from fetched data

  const selectOptions: {label: string, value: string}[] = [];


  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = ({ target: { value } }: ChangeEvent<{ value: string }>) =>
    onChange(value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, value);

  return (
    <TextField
      id={id}
      name={id}
      label={labelValue(label, hideLabel || !label, false)}
      value={isEmpty ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      {...(textFieldProps as TextFieldProps)}
      select // Apply this and the following props after the potential overrides defined in textFieldProps
      InputLabelProps={{
        ...textFieldProps.InputLabelProps,
        shrink: !isEmpty,
      }}
      SelectProps={{
        ...textFieldProps.SelectProps,
        multiple,
      }}
      aria-describedby={ariaDescribedByIds<T>(id)}
    >
      {Array.isArray(selectOptions) &&
        selectOptions.map(({ value, label }, i: number) => {
          return (
            <MenuItem key={i} value={value} disabled={disabled || readonly}>
              {label}
            </MenuItem>
          );
        })}
    </TextField>
  );

};

