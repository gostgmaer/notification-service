import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const PUBLIC_KEY = 'isPublic';
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata(PUBLIC_KEY, true);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const apiKey = this.config.get<string>('apiKey');
    if (!apiKey) return true; // no key configured → open

    const req: Request = ctx.switchToHttp().getRequest();
    const provided =
      (req.headers['x-api-key'] as string) ||
      (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');

    if (provided !== apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
