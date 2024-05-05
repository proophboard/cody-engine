import {BreadcrumbFn} from "@frontend-ai/app/pages/page-definitions";

export const staticLabel = (label: string): BreadcrumbFn => {
  return (params, queryClient, onLabelChanged) => {
    onLabelChanged(label);
    return () => {};
  }
}
