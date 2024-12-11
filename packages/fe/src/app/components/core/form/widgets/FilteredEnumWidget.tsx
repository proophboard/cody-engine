import * as React from 'react';
import {EnumOptionsType, WidgetProps} from "@rjsf/utils";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import jexl from "@app/shared/jexl/get-configured-jexl";

interface OwnProps {

}

type FilteredEnumWidgetProps = OwnProps & WidgetProps;

const FilteredEnumWidget = (props: FilteredEnumWidgetProps) => {
  const SelectWidget = props.registry.widgets.SelectWidget;
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();

  const jexlCtx = {...routeParams, form: props.formContext?.data || {}, user, page: pageData}

  const enumVals = props.options.enumOptions || [];
  const filter = props.options.filter as string || 'true';
  const map = props.options.map as string || 'item';
  const sort = props.options.sort === 'desc' ? -1 : 1;
  const selectedVal = props.value;

  const optionalSort = (arrayToSort: EnumOptionsType[]): EnumOptionsType[] => {
    if(!props.options.sort) {
      return arrayToSort;
    }

    return arrayToSort.sort((a,b) => a.label.localeCompare(b.label) * sort);
  }

  const filteredProps = {
    ...props, options: {
      ...props.options,
      enumOptions: optionalSort(enumVals
        .filter(item => item.value === selectedVal || jexl.evalSync(filter, {...jexlCtx, item: item}))
        .map(item => jexl.evalSync(map, {...jexlCtx, item: item})))
    }
  };

  if(!props.required) {
    filteredProps.options.enumOptions.push({label: "- Empty -",value: undefined});
  }

  return <SelectWidget {...filteredProps} />
};

export default FilteredEnumWidget;
