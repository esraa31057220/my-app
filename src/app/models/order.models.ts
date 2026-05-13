export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: number;
  orderDate: string;
  orderStatus: string;
  totalPrice: number;
  shippingAddress: string;
  items: OrderItem[];
}

export interface CheckoutResponse {
  message: string;
  orderId: number;
  total: number;
}
