export const cloneDeepJSON = <T>(val: T): T => {
  return JSON.parse(JSON.stringify(val));
}
