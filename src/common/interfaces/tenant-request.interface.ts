import { Request } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string; // It's optional because not all routes might have it yet
}
