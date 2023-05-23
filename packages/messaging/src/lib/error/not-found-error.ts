export class NotFoundError extends Error {
  public readonly statusCode: number;

  constructor(message: string) {
    super();
    this.message = message;
    this.statusCode = 404;
  }
}
