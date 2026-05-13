export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/** API + view-model line (templates use title / thumbnail; API may use productName / image). */
export interface IOrderLineItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  title?: string;
  thumbnail?: string;
}

/** @deprecated use IOrderLineItem */
export type IOrderItem = IOrderLineItem;

export interface IOrder {
  id?: number | string;
  userId?: number | string;
  userName?: string;
  items?: IOrderLineItem[];
  totalPrice?: number;
  total?: number;
  orderDate?: Date | string;
  createdAt?: Date | string;
  status?: OrderStatus | string;
  shippingAddress?: string;
  address?: string;
  city?: string;
  phone?: string;
  paymentMethod?: 'cash' | 'card' | string;
}