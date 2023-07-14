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
import {types} from "@app/shared/types";
import {isQueryableStateListDescription, QueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {useApiQuery} from "@frontend/queries/use-api-query";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {commands} from "@frontend/app/components/commands";
import {useParams} from "react-router-dom";

// Copied from: https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/material-ui/src/SelectWidget/SelectWidget.tsx
// and modified to use useApiQuery and turn result into select options

interface ParsedUiOptions {
  data: QueryableStateListDescription,
  label: string,
  value: string,
  addItemCommand: string | null,
}

const parseOptions = (options: any): ParsedUiOptions => {

  if(!options.data || typeof options.data !== "string") {
    throw new Error('DataSelect: no "data" attribute configured!');
  }

  if(!types[options.data]) {
    throw new Error(`DataSelect: Unknown type "${options.data}"`);
  }

  const vo = types[options.data];

  if(!isQueryableStateListDescription(vo.desc)) {
    throw new Error(`DataSelect: Type "${options.data}" is not a queryable list`);
  }

  if(!options.label || typeof options.label !== "string") {
    throw new Error(`DataSelect: ui:options "label" is not a string`);
  }

  if(!options.value || typeof options.value !== "string") {
    throw new Error(`DataSelect: ui:options "value" is not a string`);
  }

  if(options.addItemCommand && typeof options.addItemCommand !== "string") {
    throw new Error(`DataSelect: ui:options "addItemCommand" is not a valid command name`)
  }

  return {
    data: vo.desc,
    label: options.label,
    value: options.value,
    addItemCommand: options.addItemCommand || null,
  }
}

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

  const selectOptions: {label: string, value: string, readonly: boolean}[] = [];
  const parsedOptions = parseOptions(options);
  const routeParams = useParams();

  const query = useApiQuery(parsedOptions.data.query, routeParams);

  if(query.isSuccess) {
    (query.data as any[]).forEach(item => {
      selectOptions.push({
        label: jexl.evalSync(parsedOptions.label, {data: item}),
        value: jexl.evalSync(parsedOptions.value, {data: item}),
        readonly: false
      });
    })
  } else {
    selectOptions.push({label: "Loading ...", value: "", readonly: true});
  }

  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = ({ target: { value } }: ChangeEvent<{ value: string }>) =>
    onChange(value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, value);

  const AddItemCommand = parsedOptions.addItemCommand && commands[parsedOptions.addItemCommand] ? commands[parsedOptions.addItemCommand] : null;

  return (
    <>
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
          selectOptions.map(({ value, label, readonly }, i: number) => {
            return (
              <MenuItem key={i} value={value} disabled={readonly}>
                {label}
              </MenuItem>
            );
          })}
      </TextField>
      {AddItemCommand && <AddItemCommand buttonProps={{variant: 'text', style: {width: "fit-content", marginLeft: 0}}}/>}
    </>
  );

};

