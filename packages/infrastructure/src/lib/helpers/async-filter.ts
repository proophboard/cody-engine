
export async function* asyncFilter<T>(iter: AsyncIterable<T>, filter: (item: T) => Promise<boolean>): AsyncIterable<T> {
  for await (const item of iter) {
    if(await filter(item)) {
      yield item;
    }
  }
}
