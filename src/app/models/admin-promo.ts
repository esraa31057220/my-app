export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  expiresAt?: string;
  active: boolean;
}
