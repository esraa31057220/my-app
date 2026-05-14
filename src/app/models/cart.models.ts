export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  totalItemPrice: number;
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
}
