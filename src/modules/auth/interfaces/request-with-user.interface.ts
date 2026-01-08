import { Request } from 'express';
import { Role } from '../enums/role.enum';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    phone: string;
    role: Role;
    chamberId?: string; // Add this field!
  };
}
