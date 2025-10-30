export const parseJson = <T>(content: string): T => {
  return JSON.parse(content) as T;
}
