export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export class NotImplementedError extends HttpError {
  constructor(message: string) {
    super(501, message);
    this.name = "NotImplementedError";
  }
}
