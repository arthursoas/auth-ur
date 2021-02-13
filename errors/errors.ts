export class BaseError extends Error {
  code: number;

  constructor(code: number, message: string, name?: string) {
    super(message);

    this.code = code;
    this.message = message;
    this.name = name || 'BaseError';
  }
}

export class AuthorizationError extends BaseError {
  constructor(code: number, message: string) {
    super(code, message, 'AuthorizationError');
  }
}
