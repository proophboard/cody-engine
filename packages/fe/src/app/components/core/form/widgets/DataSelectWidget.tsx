import { ChangeEvent, FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {Autocomplete, Checkbox, ListItemText, MenuItem, TextField, TextFieldProps} from "@mui/material";
import {useApiQuery} from "@frontend/queries/use-api-query";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {commands} from "@frontend/app/components/commands";
import {useParams} from "react-router-dom";
import {mapProperties} from "@app/shared/utils/map-properties";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {parseOptions} from "@frontend/app/components/core/form/widgets/data-select/parse-options";
import {JSONSchemaWithId} from "@frontend/app/components/core/form/widgets/json-schema/json-schema-with-id";

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

  const selectOptions: {label: string, value: string | undefined, readonly: boolean, fullDataSet: any}[] = [];
  const parsedOptions = parseOptions(options, registry.rootSchema as JSONSchemaWithId);
  const routeParams = useParams();
  const [user,] = useUser();
  const [pageData,] = usePageData();

  const hasQueryMapping = Object.keys(parsedOptions.query).length > 0;

  const mappedParams: Record<string, any> = hasQueryMapping ? {} : routeParams;
  const propertyMapping: Record<string, string> = {};

  const jexlCtx = {...routeParams, form: formContext?.data || {}, user, page: pageData};

  if(hasQueryMapping) {
    for (const mappedKey in parsedOptions.query) {
      const mappingExpr = parsedOptions.query[mappedKey];

      if(mappedKey === '$not') {
        propertyMapping[mappedKey] = mappingExpr;
        continue;
      }

      mappedParams[mappedKey] = jexl.evalSync(mappingExpr, jexlCtx);
    }
  }
  const query = useApiQuery(parsedOptions.data.query, mapProperties(mappedParams, propertyMapping));

  if(query.isSuccess) {
    (query.data as any[])
      .filter(item => {
        if(parsedOptions.filter) {
          return jexl.evalSync(parsedOptions.filter, {...jexlCtx, data: item})
        }

        return true;
      })
      .forEach(item => {
        selectOptions.push({
          label: jexl.evalSync(parsedOptions.label, {...jexlCtx, data: item}),
          value: jexl.evalSync(parsedOptions.value, {...jexlCtx, data: item}),
          readonly: false,
          fullDataSet: item
        });
      })

    if(!required && !multiple) {
      selectOptions.push({
        label: "- Empty -",
        value: undefined,
        readonly: false,
        fullDataSet: null
      })
    }

  } else {
    selectOptions.push({label: "Loading ...", value: undefined, readonly: true, fullDataSet: null});
  }

  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = (value: string | string[] | null) => {
    if(parsedOptions.updateForm && formContext) {
      const selectedOption = selectOptions.find(opt => opt.value === value);

      if(selectedOption) {
        const updateFormExe = makeSyncExecutable(parsedOptions.updateForm);

        const result = updateFormExe({...jexlCtx, form: cloneDeepJSON(jexlCtx.form), data: selectedOption.fullDataSet, update: {}});

        formContext.updateForm(result.update);
      }
    }

    onChange(value);
  }

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, value);

  const AddItemCommand = parsedOptions.addItemCommand && commands[parsedOptions.addItemCommand] ? commands[parsedOptions.addItemCommand] : null;

  const isOptionSelected = (optVal: any): boolean => {
    if(multiple) {
      if(Array.isArray(value)) {
        return value.includes(optVal);
      }

      return false;
    } else {
      return optVal === value;
    }
  }

  return (
    <>
      {options.autocomplete ?
        <Autocomplete
          id={id}
          // value={isEmpty ? emptyValue : value}
          value={selectOptions.find(opt => opt.value === value) ?? null}
          disabled={disabled || readonly}
          multiple={multiple}
          getOptionDisabled={o => o.readonly}
          renderOption={(props: any, option) => {
            const { key, ...optionProps } = props;
            return (
              <MenuItem key={key} {...optionProps} sx={option.label === '- Empty -'? {color: theme => theme.palette.text.disabled} : {}}>
                {option.label}
              </MenuItem>
            );
          }}
          renderInput={(params) => <TextField
            name={id}
            required={required}
            autoFocus={autofocus}
            placeholder={placeholder}
            error={rawErrors.length > 0}
            {...params}
            label={labelValue(label, hideLabel || !label, false)} />
          }
          onFocus={_onFocus}
          onBlur={_onBlur}
          options={selectOptions}
          onChange={(e, v) => _onChange(v? Array.isArray(v) ? v.map(v => v.value as string) : v.value as string : null)}
        />
        :
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
        onChange={e => _onChange(e.target.value)}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...(textFieldProps as TextFieldProps)}
        select // Apply this and the following props after the potential overrides defined in textFieldProps
        InputLabelProps={{
          required: !hideLabel && required,
          ...textFieldProps.InputLabelProps,
          shrink: !isEmpty,
        }}
        SelectProps={{
          ...textFieldProps.SelectProps,
          multiple,
          renderValue: ((selected: any) => {
            if(!Array.isArray(selectOptions)) {
              return selected;
            }

            if(multiple && Array.isArray(selected) && Array.isArray(selectOptions)) {
              return selected.map(val => (selectOptions.find(o => o.value === val) ?? {label: ''}).label).join(", ")
            } else {
              return (selectOptions.find(o => o.value === selected) ?? {label: ''}).label;
            }
          })
        }}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {Array.isArray(selectOptions) &&
          selectOptions.map(({ value, label, readonly }, i: number) => {
            return (
              <MenuItem key={i} value={value} disabled={readonly} sx={label === '- Empty -'? {color: theme => theme.palette.text.disabled} : {}}>
                {options.checkbox && <Checkbox checked={isOptionSelected(value)} disabled={readonly} />}
                <ListItemText primary={label} />
              </MenuItem>
            );
          })}
      </TextField>}
      {AddItemCommand && <AddItemCommand buttonProps={{variant: 'text', style: {width: "fit-content", marginLeft: 0}}}/>}
    </>
  );
}

