export interface SellerSales {
  totalRevenue: number;
}

export interface LowStockProduct {
  name: string;
  stockQuantity: number;
}

export interface SellerOrder {
  orderId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  customerName: string;
  orderDate: string;
  status: string;
}

export interface TopProduct {
  productName: string;
  totalSold: number;
  totalRevenue: number;
}
