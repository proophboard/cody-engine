import {UseQueryResult} from "@tanstack/react-query";

export const dataValueGetter = (query: UseQueryResult, itemIdentifier: string, cellValue: any, valueGetter: (data: any) => string): string => {
  if(query.isSuccess) {
    if(!Array.isArray(query.data)) {
      return '⚠ Error: No list returned!'
    }

    const matchingItem = query.data.find(item => item[itemIdentifier] === cellValue);

    if(!matchingItem && !cellValue) {
      return '-';
    }

    if(!matchingItem) {
      return '⚠ Error: Not found!'
    }

    return valueGetter(matchingItem);
  }

  if(query.isError) {
    return '⚠️Error: Failed loading!';
  }

  return 'Loading ...';
}
