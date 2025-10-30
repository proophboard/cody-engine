export const stringify = (val: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string => {
  if(typeof val !== "string") {
    return JSON.stringify(val, replacer, space);
  }

  return val;
}
