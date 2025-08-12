import {startCase} from "lodash";

export const nodeLabel = (nodeFQCN: string): string => {
  if(nodeFQCN === '') {
    return '';
  }

  const parts = nodeFQCN.split(".");

  return startCase(parts.pop());
}
