import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { getRequestId } from '../middleware/rtracer';
import { AppException } from './app.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const requestId = getRequestId();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal Server Error';
    let errorCode: string = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof AppException) {
      const res = exception.getResponse() as any;
      errorCode = exception.errorCode;
      message = res.message;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message =
        typeof res === 'object' && (res as any).message
          ? (res as any).message
          : exception.message;
      errorCode = 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const displayMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    const logData = {
      requestId,
      method: httpAdapter.getRequestMethod(request),
      path: httpAdapter.getRequestUrl(request),
      status,
      message: displayMessage,
      errorCode,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[RequestID: ${requestId}] ${logData.method} ${logData.path} | Status: ${status} | Code: ${errorCode} | Error: ${message}`,
        exception.stack,
      );
    }

    const responseBody = {
      success: false,
      error: {
        statusCode: status,
        errorCode,
        message:
          status >= 500 && process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : displayMessage,
        requestId,
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(request),
      },
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
