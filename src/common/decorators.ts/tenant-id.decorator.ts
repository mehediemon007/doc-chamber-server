import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../interfaces/tenant-request.interface';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    // Cast the generic request to our TenantRequest interface
    const request = ctx.switchToHttp().getRequest<TenantRequest>();

    return request.tenantId; // Now TypeScript knows this property exists!
  },
);
