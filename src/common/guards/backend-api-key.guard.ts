import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

// Validates the X-API-KEY header against BACKEND_API_KEY environment variable.
@Injectable()
export class BackendApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];
    const validKey = process.env.BACKEND_API_KEY;

    if (!validKey) {
      throw new InternalServerErrorException('BACKEND_API_KEY is not configured on the server.');
    }

    if (!providedKey || providedKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API key.');
    }

    return true;
  }
}
