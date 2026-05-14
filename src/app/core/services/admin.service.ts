import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdminOrder, AdminStats, AdminUser } from '../../models';

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
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Admin`;

  getStats(): Observable<AdminStats> {
    return this.http.get<unknown>(`${this.base}/AllStates`).pipe(
      map((raw) => {
        const o = asRecord(raw);
        return {
          userCount: Number(
            pick(o, ['userCount', 'UserCount', 'usersCount', 'UsersCount']) ?? 0
          ),
          orderCount: Number(
            pick(o, ['orderCount', 'OrderCount', 'ordersCount', 'OrdersCount']) ?? 0
          ),
          totalRevenue: Number(
            pick(o, ['totalRevenue', 'TotalRevenue', 'revenue', 'Revenue']) ?? 0
          ),
        } as AdminStats;
      })
    );
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<unknown>(`${this.base}/AllUsers`).pipe(
      map((raw) =>
        asArray(raw).map((row) => {
          const o = asRecord(row);
          return {
            id: String(pick(o, ['id', 'Id', 'userId', 'UserId']) ?? ''),
            firstName: String(
              pick(o, ['firstName', 'FirstName', 'givenName', 'GivenName']) ?? ''
            ),
            lastName: String(
              pick(o, ['lastName', 'LastName', 'familyName', 'FamilyName', 'surname']) ?? ''
            ),
            email: String(pick(o, ['email', 'Email']) ?? ''),
            userName: String(pick(o, ['userName', 'UserName']) ?? ''),
          } as AdminUser;
        })
      )
    );
  }

  getAllOrders(): Observable<AdminOrder[]> {
    return this.http.get<unknown>(`${this.base}/AllOrders`).pipe(
      map((raw) =>
        asArray(raw).map((row) => {
          const o = asRecord(row);
          return {
            id: Number(pick(o, ['id', 'Id', 'orderId', 'OrderId']) ?? 0),
            shppingAddress: String(
              pick(o, ['shppingAddress', 'ShppingAddress', 'shippingAddress', 'ShippingAddress']) ??
                ''
            ),
            orderDate: String(pick(o, ['orderDate', 'OrderDate']) ?? ''),
            totalPrice: Number(pick(o, ['totalPrice', 'TotalPrice', 'total', 'Total']) ?? 0),
            orderStatus: String(pick(o, ['orderStatus', 'OrderStatus', 'status', 'Status']) ?? ''),
            customerName: String(
              pick(o, ['customerName', 'CustomerName', 'userName', 'UserName']) ?? ''
            ),
            customerEmail: String(
              pick(o, ['customerEmail', 'CustomerEmail', 'email', 'Email']) ?? ''
            ),
            customerAddress: String(
              pick(o, ['customerAddress', 'CustomerAddress', 'address', 'Address']) ?? ''
            ),
            customerPhone: String(
              pick(o, [
                'customerPhone',
                'CustomerPhone',
                'phoneNumber',
                'PhoneNumber',
                'phone',
                'Phone',
              ]) ?? ''
            ),
          } as AdminOrder;
        })
      )
    );
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    const body = JSON.stringify(status);
    return this.http.put(`${this.base}/UpdateOrderStatus/${id}`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
