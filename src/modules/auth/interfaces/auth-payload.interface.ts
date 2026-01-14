export interface JwtPayload {
  sub: string;
  fullName: string;
  phone: string;
  role: string;
  chamberId?: string;
  iat?: number;
  exp?: number;
}
