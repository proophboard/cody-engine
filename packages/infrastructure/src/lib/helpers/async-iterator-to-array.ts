export const asyncIteratorToArray = async <T>(iter: AsyncIterable<T>): Promise<Array<T>> => {
  const arr = [];

  for await (const item of iter) {
    arr.push(item);
  }

  return arr;
}
