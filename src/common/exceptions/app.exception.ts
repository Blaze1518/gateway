import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_REGISTRY } from './error-registry';
export class AppException extends HttpException {
  public readonly errorCode: string;

  constructor(error: (typeof ERROR_REGISTRY)[keyof typeof ERROR_REGISTRY]) {
    super({ errorCode: error.errorCode, message: error.message }, error.status);
    this.errorCode = error.errorCode;
  }
}
