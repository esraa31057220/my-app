import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LowStockProduct,
  SellerOrder,
  SellerSales,
  TopProduct,
} from '../../models';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = asRecord(raw);
  for (const key of ['data', 'Data', 'items', 'Items', 'results', 'Results', 'value', 'Value']) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(r['$values'])) return r['$values'] as unknown[];
  return [];
}

function pick<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

@Injectable({ providedIn: 'root' })
export class SellerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Seller`;

  getSalesStatus(): Observable<SellerSales> {
    return this.http.get<unknown>(`${this.base}/Sales_Status`).pipe(
      map((raw) => {
        const o = asRecord(raw);
        const totalRevenue = Number(
          pick(o, ['totalRevenue', 'TotalRevenue', 'total', 'Total']) ?? 0
        );
        return { totalRevenue } as SellerSales;
      })
    );
  }

  getLowStock(): Observable<LowStockProduct[]> {
    return this.http.get<unknown>(`${this.base}/LowStockAlert`).pipe(
      map((raw) =>
        asArray(raw).map((row) => {
          const o = asRecord(row);
          return {
            name: String(pick(o, ['name', 'Name', 'productName', 'ProductName']) ?? ''),
            stockQuantity: Number(
              pick(o, ['stockQuantity', 'StockQuantity', 'stock', 'Stock']) ?? 0
            ),
          } as LowStockProduct;
        })
      )
    );
  }

  getMyOrders(): Observable<SellerOrder[]> {
    return this.http.get<unknown>(`${this.base}/MyOrders`).pipe(
      map((raw) =>
        asArray(raw).map((row) => {
          const o = asRecord(row);
          return {
            orderId: Number(pick(o, ['orderId', 'OrderId', 'id', 'Id']) ?? 0),
            productName: String(pick(o, ['productName', 'ProductName', 'name', 'Name']) ?? ''),
            quantity: Number(pick(o, ['quantity', 'Quantity']) ?? 0),
            unitPrice: Number(pick(o, ['unitPrice', 'UnitPrice', 'price', 'Price']) ?? 0),
            customerName: String(
              pick(o, ['customerName', 'CustomerName', 'userName', 'UserName']) ?? ''
            ),
            orderDate: String(pick(o, ['orderDate', 'OrderDate']) ?? ''),
            status: String(pick(o, ['status', 'Status', 'orderStatus', 'OrderStatus']) ?? ''),
          } as SellerOrder;
        })
      )
    );
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.http.get<unknown>(`${this.base}/TopSellingProducts`).pipe(
      map((raw) =>
        asArray(raw).map((row) => {
          const o = asRecord(row);
          return {
            productName: String(pick(o, ['productName', 'ProductName', 'name', 'Name']) ?? ''),
            totalSold: Number(pick(o, ['totalSold', 'TotalSold', 'sold', 'Sold']) ?? 0),
            totalRevenue: Number(
              pick(o, ['totalRevenue', 'TotalRevenue', 'revenue', 'Revenue']) ?? 0
            ),
          } as TopProduct;
        })
      )
    );
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.base}/UpdateProfile`, data);
  }
}
