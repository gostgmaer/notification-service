import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req: Request = ctx.switchToHttp().getRequest();
    const res: Response = ctx.switchToHttp().getResponse();

    // Attach requestId if not set
    if (!req.requestId) {
      req.requestId = uuidv4();
    }
    res.setHeader('x-request-id', req.requestId);

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${req.method} ${req.url} ${res.statusCode} +${Date.now() - start}ms [${req.requestId}]`,
        );
      }),
    );
  }
}
