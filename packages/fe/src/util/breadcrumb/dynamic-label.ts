import {QueryObserver} from "@tanstack/react-query";
import {BreadcrumbFn} from "@frontend/app/pages/page-definitions";

export const dynamicLabel = <T>(queryName: string, queryFn: (params: any) => Promise<T>, onResult: (data: T) => string, defaultLabel = 'Loading ...'): BreadcrumbFn => {
  return (params, queryClient, onLabelChanged) => {
    let data: T | undefined = undefined;
    const queryKey = [queryName, params];
    data = queryClient.getQueryData(queryKey);

    const label = data ? onResult(data) : defaultLabel;

    onLabelChanged(label);

    const observer = new QueryObserver<T>(queryClient, {queryKey, queryFn: () => queryFn(params)});

    return observer.subscribe((result) => {
      if(result.isSuccess) {
        onLabelChanged(onResult(result.data));
      }
    })
  }
}
