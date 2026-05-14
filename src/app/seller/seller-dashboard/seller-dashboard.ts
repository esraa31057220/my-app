import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { SellerStatsService } from '../services/seller-stats.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.css',
})
export class SellerDashboard implements OnInit {
  private products = inject(ProductService);
  private orders = inject(OrderService);
  private sellerStats = inject(SellerStatsService);

  loading = signal(true);
  productCount = signal(0);
  orderCount = signal(0);
  totalRevenue = signal<number | null>(null);
  lowStockCount = signal(0);

  ngOnInit(): void {
    forkJoin({
      products: this.products.getProducts().pipe(catchError(() => of([]))),
      orders: this.orders.getAllOrders().pipe(catchError(() => of([]))),
      sales: this.sellerStats.salesStatus().pipe(catchError(() => of(null))),
      lowStock: this.sellerStats.lowStockAlert().pipe(catchError(() => of(null))),
    }).subscribe({
      next: (r) => {
        this.productCount.set(Array.isArray(r.products) ? r.products.length : 0);
        this.orderCount.set(Array.isArray(r.orders) ? r.orders.length : 0);
        
        // Calculate revenue from orders
        if (Array.isArray(r.orders)) {
          const revenue = r.orders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
          this.totalRevenue.set(revenue);
        }

        // Extract low stock count
        if (r.lowStock && typeof r.lowStock === 'object') {
          const lowStockObj = r.lowStock as Record<string, unknown>;
          this.lowStockCount.set(Number(lowStockObj['count'] ?? lowStockObj['lowStockCount'] ?? 0));
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
