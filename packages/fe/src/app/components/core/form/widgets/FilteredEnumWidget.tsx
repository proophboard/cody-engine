import * as React from 'react';
import {EnumOptionsType, labelValue, WidgetProps} from "@rjsf/utils";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {Autocomplete, TextField} from "@mui/material";
import {FocusEvent} from "react";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {Rule} from "@app/shared/rule-engine/configuration";

type FilteredEnumWidgetProps = WidgetProps;

const FilteredEnumWidget = (props: FilteredEnumWidgetProps) => {
  const SelectWidget = props.registry.widgets.SelectWidget;
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();

  const jexlCtx = {...routeParams, form: props.registry.formContext?.data || {}, user, page: pageData}

  const enumVals = props.options.enumOptions || [];
  const filter = props.options.filter as string || 'true';
  const map = props.options.map as string || 'item';
  const sort = props.options.sort === 'desc' ? -1 : 1;
  const selectedVal = props.value;
  const autocomplete = !!props.options.autocomplete;

  const optionalSort = (arrayToSort: EnumOptionsType[]): EnumOptionsType[] => {
    if(!props.options.sort) {
      return arrayToSort;
    }

    return arrayToSort.sort((a,b) => a.label.localeCompare(b.label) * sort);
  }

  const orgOnChange = props.onChange;
  const _onChange = (value: string | string[] | null) => {
    if(props.options.updateForm && props.registry.formContext) {
      if(value) {
        const updateFormExe = makeSyncExecutable(props.options.updateForm as Rule[]);

        const result = updateFormExe({
          ...jexlCtx,
          form: cloneDeepJSON(jexlCtx.form),
          data: value,
          update: {}}
        );

        props.registry.formContext.updateForm(result.update);
      }
    }

    orgOnChange(value);
  }

  const filteredProps = {
    ...props, options: {
      ...props.options,
      enumOptions: optionalSort(enumVals
        .filter(item => item.value === selectedVal || jexl.evalSync(filter, {...jexlCtx, item: item}))
        .map(item => jexl.evalSync(map, {...jexlCtx, item: item})))
    },
    onChange: _onChange
  };

  if(!props.required) {
    filteredProps.options.enumOptions.push({label: "- Empty -",value: undefined});
  }

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    props.onBlur(props.id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    props.onFocus(props.id, value);

  if(autocomplete) {
    return <Autocomplete renderInput={(params) => <TextField
      name={props.id}
      required={props.required}
      autoFocus={props.autofocus}
      placeholder={props.placeholder}
      error={props.rawErrors && props.rawErrors.length > 0}
      {...params}
      label={labelValue(props.label, props.hideLabel || !props.label, false)} />
    }
    value={filteredProps.options.enumOptions.find(o => o.value === props.value) ?? null}
    options={filteredProps.options.enumOptions ?? []}
    onBlur={_onBlur}
    onFocus={_onFocus}
    onChange={(e,v) => {
      const forwardValue = v ? Array.isArray(v) ? v.map(v => v.value) : v.value : null;
      _onChange(forwardValue);
    }}
    />
  } else {
    return <SelectWidget {...filteredProps} />
  }
};

export default FilteredEnumWidget;
