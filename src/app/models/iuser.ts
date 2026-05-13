import type {
  SwaggerDtoLogin,
  SwaggerDtoNewUser,
  SwaggerUpdateSellerProfileDto,
} from './swagger-types';

export interface IUser {
  id?: any;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'Customer' | 'Seller' | 'Admin' | string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  /** Present when API returns account state */
  isActive?: boolean;
  isRestricted?: boolean;
  deletedAt?: string | null;
  wishlist?: number[];
  paymentDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
  };
}

export type DtoNewUser = SwaggerDtoNewUser;
export type DtoLogin = SwaggerDtoLogin;
export type UpdateSellerProfileDto = SwaggerUpdateSellerProfileDto;