export const stringify = (val: any): string => {
  if(typeof val !== "string") {
    return JSON.stringify(val);
  }

  return val;
}
