export const cloneDeepJSON = <T>(val: T): T => {
  if(typeof val === "undefined") {
    return val;
  }

  return JSON.parse(JSON.stringify(val));
}
