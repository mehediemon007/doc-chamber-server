import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm'; // Add this
import { Repository } from 'typeorm'; // Add this
import { TenantRequest } from '../interfaces/tenant-request.interface';
import { Chamber } from '../../modules/chambers/entities/chamber.entity'; // Path to your entity

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Chamber)
    private readonly chamberRepo: Repository<Chamber>, // Use standard Repository
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    // Pro Tip: Middleware runs BEFORE the router.
    // To get the slug from the URL path like /chamber/seba-clinic/bookings
    const urlParts = req.originalUrl.split('/');
    // If your path is /chamber/:slug/..., the slug is usually at index 2
    const chamberIndex = urlParts.indexOf('chamber');
    const slug = urlParts[chamberIndex + 1];

    if (!slug || slug === 'undefined') {
      throw new BadRequestException('Chamber slug is required in the URL path');
    }

    // Resolve Slug to ID
    const chamber = await this.chamberRepo.findOne({ where: { slug } });

    if (!chamber) {
      throw new NotFoundException(`Chamber with slug "${slug}" not found`);
    }

    // Attach to the request object
    req.tenantId = chamber.id;

    next();
  }
}
