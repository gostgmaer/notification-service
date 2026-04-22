import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'object' ? body : { message: body };
    } else if (exception instanceof Error) {
      // Map custom AppError codes
      const err = exception as any;
      if (err.statusCode) status = err.statusCode;
      message = err.message || 'Unexpected error';
      code = err.code;
    }

    this.logger.error(
      `${req.method} ${req.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    res.status(status).json({
      success: false,
      statusCode: status,
      ...(typeof message === 'object' ? message : { message }),
      ...(code ? { code } : {}),
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
