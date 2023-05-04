export const asyncEmptyIterator = <T>(): AsyncIterable<T> => ({
  [Symbol.asyncIterator] () {
    return {
      async next() {
        return {done: true, value: undefined}
      }
    }
  }
});
