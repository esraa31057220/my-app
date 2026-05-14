import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsersService } from '../../shared/services/user.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderService } from '../../core/services/order.service';
import { SellerStatsService } from '../services/seller-stats.service';

interface KeyValue {
  label: string;
  value: string;
  variant?: 'default' | 'warning' | 'success';
}

interface DashRow {
  title: string;
  fields: KeyValue[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private usersService = inject(UsersService);
  private products = inject(ProductService);
  private categories = inject(CategoryService);
  private orders = inject(OrderService);
  private seller = inject(SellerStatsService);

  loading = signal(true);
  userCount = signal(0);
  orderCount = signal(0);
  productCount = signal(0);
  categoryCount = signal(0);

  totalRevenue = signal<number | null>(null);
  salesRows = signal<DashRow[]>([]);
  lowStockRows = signal<DashRow[]>([]);
  topSellingRows = signal<DashRow[]>([]);

  ngOnInit(): void {
    forkJoin({
      users: this.usersService.getUsers().pipe(catchError(() => of([]))),
      orders: this.orders.getAllOrders().pipe(catchError(() => of([]))),
      products: this.products.getProducts().pipe(catchError(() => of([]))),
      categories: this.categories.getCategories().pipe(catchError(() => of([]))),
      sales: this.seller.salesStatus().pipe(catchError(() => of(null))),
      low: this.seller.lowStockAlert().pipe(catchError(() => of(null))),
      top: this.seller.topSelling().pipe(catchError(() => of(null))),
    }).subscribe({
      next: (r) => {
        this.userCount.set(Array.isArray(r.users) ? r.users.length : 0);
        this.orderCount.set(Array.isArray(r.orders) ? r.orders.length : 0);
        this.productCount.set(Array.isArray(r.products) ? r.products.length : 0);
        this.categoryCount.set(Array.isArray(r.categories) ? r.categories.length : 0);

        this.totalRevenue.set(this.extractRevenue(r.sales, r.orders));
        this.salesRows.set(this.toRows(r.sales, 'Sales'));
        this.lowStockRows.set(this.toRows(r.low, 'Product', 'warning'));
        this.topSellingRows.set(this.toRows(r.top, 'Product', 'success'));

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Walk a value of unknown shape and normalize it into a list of titled key-value rows. */
  private toRows(value: unknown, fallbackTitle: string, variant: KeyValue['variant'] = 'default'): DashRow[] {
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value
        .map((item, idx) => this.recordToRow(item, `${fallbackTitle} ${idx + 1}`, variant))
        .filter((row): row is DashRow => row !== null);
    }
    const row = this.recordToRow(value, fallbackTitle, variant);
    return row ? [row] : [];
  }

  private recordToRow(item: unknown, fallbackTitle: string, variant: KeyValue['variant']): DashRow | null {
    if (item == null) return null;
    if (typeof item !== 'object') {
      return { title: fallbackTitle, fields: [{ label: 'Value', value: String(item), variant }] };
    }
    const obj = item as Record<string, unknown>;
    const title =
      this.pickString(obj, ['name', 'productName', 'title', 'label']) ??
      this.pickString(obj, ['id', 'productId'])?.toString() ??
      fallbackTitle;

    const fields: KeyValue[] = Object.entries(obj)
      .filter(([k]) => !/^(name|productName|title|label)$/i.test(k))
      .map(([k, v]) => ({
        label: this.humanize(k),
        value: this.formatValue(v),
        variant,
      }));

    return { title, fields };
  }

  private pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
    for (const k of keys) {
      const v = obj[k];
      if (v != null && v !== '') return String(v);
    }
    return undefined;
  }

  private humanize(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]+/g, ' ')
      .replace(/^\s*./, (c) => c.toUpperCase())
      .trim();
  }

  private formatValue(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'number') {
      // money-ish: integer big numbers are formatted with commas
      return v.toLocaleString();
    }
    if (typeof v === 'string') return v;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return JSON.stringify(v);
  }

  private extractRevenue(sales: unknown, orders: unknown): number | null {
    if (sales && typeof sales === 'object') {
      const o = sales as Record<string, unknown>;
      for (const k of ['totalRevenue', 'TotalRevenue', 'revenue', 'Revenue', 'total', 'Total']) {
        const v = o[k];
        if (typeof v === 'number') return v;
      }
    }
    if (Array.isArray(orders)) {
      let sum = 0;
      for (const ord of orders) {
        const v = (ord as Record<string, unknown>)?.['totalPrice'] ?? (ord as Record<string, unknown>)?.['total'];
        if (typeof v === 'number') sum += v;
      }
      return sum;
    }
    return null;
  }
}
