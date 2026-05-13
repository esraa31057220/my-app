export interface IProduct {
  id: number;
  name: string;
  description: string;
  /** Original list price */
  price: number;
  /** Discounted/effective price — use this for billing */
  actualPrice?: number;
  stockQuantity: number;
  /** Resolved URL (normalized from imagePath by ProductService) */
  image?: string;
  /** Raw path from API */
  imagePath?: string;
  categoryId: number;
  categoryName?: string;
  sellerId?: string;
}

export interface IProductFormData {
  Name: string;
  Description: string;
  Price: number;
  StockQuantity: number;
  CategoryId: number;
  Image?: File;
}