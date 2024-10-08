export const asyncIterableToArray = async <T>(gen: AsyncIterable<T>): Promise<T[]> => {
  const out: T[] = []
  for await(const x of gen) {
    out.push(x)
  }
  return out
}
