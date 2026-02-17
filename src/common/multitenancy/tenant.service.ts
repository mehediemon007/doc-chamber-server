import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private tenantId: string | null = null;

  setTenantId(id: string) {
    this.tenantId = id;
  }

  getTenantId(): string {
    if (!this.tenantId) {
      throw new Error('Tenant ID has not been set for this request');
    }
    return this.tenantId;
  }
}
