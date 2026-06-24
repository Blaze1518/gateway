import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './rtracer';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const requestId = req.get('x-request-id') || uuidv4();
    const start = Date.now();

    res.setHeader('x-request-id', requestId);
    const store = new Map();
    store.set('requestId', requestId);

    storage.run(store, () => {
      res.on('finish', () => {
        const { statusCode } = res;
        const duration = Date.now() - start;

        const logMsg = `[RequestID: ${requestId}] ${method} ${originalUrl} | Status: ${statusCode} | Duration: ${duration}ms | IP: ${ip} | UserAgent: ${userAgent}`;
        if (statusCode >= 500) {
          this.logger.error(logMsg);
        } else if (statusCode >= 400) {
          this.logger.warn(logMsg);
        } else {
          this.logger.log(logMsg);
        }
      });

      next();
    });
  }
}
