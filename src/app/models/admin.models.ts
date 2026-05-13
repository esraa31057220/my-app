export interface AdminStats {
  userCount: number;
  orderCount: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
}

export interface AdminOrder {
  id: number;
  shppingAddress: string;
  orderDate: string;
  totalPrice: number;
  orderStatus: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPhone: string;
}
