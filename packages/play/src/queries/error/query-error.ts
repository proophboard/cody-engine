export class QueryError extends Error {
  constructor(queryName: string) {
    super(`Executing query "${queryName}" failed. Take a look at your browser console for details.`);
  }
}
