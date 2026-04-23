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

  private extractMalformedJsonField(err: any): string | null {
    if (typeof err?.body !== 'string') return null;

    const positionMatch = /position\s+(\d+)/i.exec(String(err.message || ''));
    const position = positionMatch ? Number(positionMatch[1]) : -1;
    if (position < 0) return null;

    const start = Math.max(0, position - 80);
    const end = Math.min(err.body.length, position + 80);
    const snippet = err.body.slice(start, end);

    const fieldMatch = /(?:\{|,)\s*([A-Za-z_$][\w$-]*)\s*:/.exec(snippet);
    return fieldMatch?.[1] || null;
  }

  private formatMalformedJsonMessage(err: any): string {
    const fieldName = this.extractMalformedJsonField(err);
    if (fieldName) {
      return `Invalid JSON body: property '${fieldName}' must be wrapped in double quotes.`;
    }

    return 'Invalid JSON body: property names must be wrapped in double quotes.';
  }

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
      if (err.type === 'entity.parse.failed' || /Expected double-quoted property name in JSON/i.test(err.message || '')) {
        status = HttpStatus.BAD_REQUEST;
        message = this.formatMalformedJsonMessage(err);
      } else {
        message = err.message || 'Unexpected error';
      }
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
