export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  actualPrice: number;
  stockQuantity: number;
  categoryName: string;
  imagePath: string;
  sellerId: string;
}

export interface ProductFilter {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'priceAsc' | 'priceDesc' | string;
}
