import { TenantService } from './multitenancy/tenant.service';

export abstract class BaseTenantService {
  constructor(protected readonly tenantService: TenantService) {}

  // A helper to always get the current chamber's ID
  protected get currentChamberId() {
    return this.tenantService.getTenantId();
  }
}
