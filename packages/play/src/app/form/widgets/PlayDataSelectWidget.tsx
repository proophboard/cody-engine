import {ChangeEvent, FocusEvent, useContext} from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {Autocomplete, Checkbox, ListItemText, MenuItem, TextField, TextFieldProps} from "@mui/material";
import {types} from "@app/shared/types";
import {
  isQueryableListDescription, isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription, QueryableListDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {useApiQuery} from "@frontend/queries/use-api-query";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useParams} from "react-router-dom";
import {JSONSchema7} from "json-schema-to-ts";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {names} from "@event-engine/messaging/helpers";
import {mapProperties} from "@app/shared/utils/map-properties";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {Rule} from "@app/shared/rule-engine/configuration";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {configStore} from "@cody-play/state/config-store";
import PlayCommand from "@cody-play/app/components/core/PlayCommand";

// Copied from: https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/material-ui/src/SelectWidget/SelectWidget.tsx
// and modified to use useApiQuery and turn result into select options

type JSONSchemaWithId = JSONSchema7 & {$id: string};

interface ParsedUiOptions {
  data: QueryableStateListDescription | QueryableListDescription,
  label: string,
  value: string,
  addItemCommand: string | null,
  query: Record<string, string>,
  filter?: string,
  updateForm?: Rule[]
}

const getVOFromTypes = (refOrFQCN: string, rootSchema: JSONSchemaWithId): ValueObjectRuntimeInfo => {
  if(refOrFQCN[0] === "/") {
    const rootId = rootSchema.$id || '';
    const definitionIdParts = rootId.replace('/definitions/', '').split('/');
    const service = names(definitionIdParts[0] || '').className;
    refOrFQCN = (service + refOrFQCN).split("/").join(".");
  }

  if(!types[refOrFQCN]) {
    throw new Error(`DataSelect: Unknown type "${refOrFQCN}"`);
  }

  return types[refOrFQCN];
}

const parseOptions = (options: any, rootSchema: JSONSchemaWithId): ParsedUiOptions => {
  if(!options.data || typeof options.data !== "string") {
    throw new Error('DataSelect: no "data" attribute configured!');
  }

  const vo = getVOFromTypes(options.data, rootSchema);

  if(!isQueryableStateListDescription(vo.desc) && !isQueryableListDescription(vo.desc) && !isQueryableNotStoredStateListDescription(vo.desc)) {
    throw new Error(`DataSelect: Type "${options.data}" is not a queryable list`);
  }

  if((!options.label || typeof options.label !== "string") && (!options.text || typeof options.text !== "string")) {
    throw new Error(`DataSelect: ui:options "label" is not a string`);
  }

  if(!options.value || typeof options.value !== "string") {
    throw new Error(`DataSelect: ui:options "value" is not a string`);
  }

  if(options.addItemCommand && typeof options.addItemCommand !== "string") {
    throw new Error(`DataSelect: ui:options "addItemCommand" is not a valid command name`)
  }

  if(options.updateForm && !Array.isArray(options.updateForm)) {
    throw new Error(`DataSelect: ui:options "updateForm" must be an array of rules`)
  }

  return {
    data: vo.desc,
    label: options.label || options.text,
    value: options.value,
    addItemCommand: options.addItemCommand || null,
    query: options.query || {},
    filter: options.filter,
    updateForm: options.updateForm,
  }
}

export default function PlayDataSelectWidget<
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

    if(!required) {
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

  const playConfig = useContext(configStore);

  const AddItemCommand = parsedOptions.addItemCommand && playConfig.config.commands[parsedOptions.addItemCommand] ? playConfig.config.commands[parsedOptions.addItemCommand] : null;

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
            label={labelValue(label, hideLabel || !label, false)}
          />
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
        aria-describedby={ariaDescribedByIds<T>(id)}
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
      {AddItemCommand && <PlayCommand command={AddItemCommand} buttonProps={{variant: 'text', style: {width: "fit-content", marginLeft: 0}}}/>}
    </>
  );
}

