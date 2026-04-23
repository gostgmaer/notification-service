import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId: string | null;
      requestId: string;
      appContext: Record<string, string>;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    // Soft tenant resolution — never blocks
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-tanent'] as string) || // typo-compatibility
      this.config.get<string>('defaultTenantId') ||
      null;
    req.tenantId = tenantId;

    // App context (email branding per-request)
    req.appContext = {
      applicationName:
        (req.headers['x-app-name'] as string) ||
        (req.headers['x-app'] as string) ||
        process.env.APPLICATION_NAME ||
        'Notification Service',
      appUrl: (req.headers['x-app-url'] as string) || '',
      ctaPath: (req.headers['x-path'] as string) || '',
    };

    next();
  }
}
