
export async function* asyncMap<T, M>(iter: AsyncIterable<M>, map: (item: M, index: number) => T | Promise<T>): AsyncIterable<T> {
  let index = 0;

  for await (const item of iter) {
    const mappedItem = await map(item, index);
    index++;
    yield mappedItem;
  }
}
