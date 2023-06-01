import {BreadcrumbFn} from "@frontend/app/pages/page-definitions";

export const staticLabel = (label: string): BreadcrumbFn => {
  return (params, queryClient, onLabelChanged) => {
    onLabelChanged(label);
    return () => {};
  }
}
