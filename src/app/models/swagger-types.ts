/** Types derived from `src/swagger/swagger.json` (OpenAPI 3 components & paths). */

export interface SwaggerCategoryDto {
  name?: string | null;
}

export interface SwaggerDtoLogin {
  email: string;
  password: string;
}

export interface SwaggerDtoNewUser {
  firstName: string;
  lastName: string;
  password: string;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  role?: string | null;
}

export interface SwaggerUpdateSellerProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
}

export type SwaggerOrderStatusBody = string;
