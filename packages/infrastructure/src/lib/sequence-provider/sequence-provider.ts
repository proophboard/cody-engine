export interface SequenceProvider {
  getNextSequenceValue: (name: string) => Promise<number>;
}
