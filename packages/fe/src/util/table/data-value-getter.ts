import {UseQueryResult} from "@tanstack/react-query";

const matchItem = (query: UseQueryResult, itemIdentifier: string, idValue: any, valueGetter: (data: any) => string): string => {

  if(query.isSuccess) {
    if(!Array.isArray(query.data)) {
      return '⚠️ Error: No list returned!'
    }

    const matchingItem = query.data.find(item => item[itemIdentifier] === idValue);

    if(!matchingItem && !idValue) {
      return '-';
    }

    if(!matchingItem) {
      return '⚠️ Error: Not found!'
    }

    return valueGetter(matchingItem);
  }

  return '-';
}

export const dataValueGetter = (query: UseQueryResult, itemIdentifier: string, cellValue: any, valueGetter: (data: any) => string, multiple?: boolean): string => {
  if(query.isSuccess) {
    if(!Array.isArray(query.data)) {
      return '⚠ Error: No list returned!'
    }

    if(multiple) {
      if(!cellValue) {
        return '-';
      }

      return cellValue.split(",").map((v: string) => matchItem(query, itemIdentifier, v.trim(), valueGetter)).join(", ");
    } else {
      return matchItem(query, itemIdentifier, cellValue, valueGetter);
    }
  }

  if(query.isError) {
    return '⚠️ Error: Failed loading!';
  }

  return 'Loading ...';
}
