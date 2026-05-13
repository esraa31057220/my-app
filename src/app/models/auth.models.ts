export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  address?: string;
  phoneNumber?: string;
  city?: string;
  role?: 'Customer' | 'Seller';
}
