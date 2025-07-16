import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";

export const isFormView = (comp: ViewComponent): boolean => {
  if(typeof comp === "string") {
    return false;
  }

  if(!comp.type) {
    return false;
  }

  return comp.type === "form";
}
