import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { SellerStatsService } from '../services/seller-stats.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-seller-earnings',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './seller-earnings.html',
  styleUrl: './seller-earnings.css',
})
export class SellerEarnings implements OnInit {
  private orders = inject(OrderService);
  private sellerStats = inject(SellerStatsService);

  loading = signal(true);
  totalRevenue = signal<number>(0);
  totalOrders = signal<number>(0);
  averageOrderValue = signal<number>(0);
  pendingPayouts = signal<number>(0);
  completedPayouts = signal<number>(0);

  recentOrders = signal<any[]>([]);

  ngOnInit(): void {
    forkJoin({
      orders: this.orders.getAllOrders().pipe(catchError(() => of([]))),
      sales: this.sellerStats.salesStatus().pipe(catchError(() => of(null))),
    }).subscribe({
      next: (r) => {
        const orders = Array.isArray(r.orders) ? r.orders : [];
        
        // Calculate metrics
        const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
        this.totalRevenue.set(revenue);
        this.totalOrders.set(orders.length);
        this.averageOrderValue.set(orders.length > 0 ? revenue / orders.length : 0);
        
        // Mock payout data [NO ENDPOINT]
        this.pendingPayouts.set(revenue * 0.3);
        this.completedPayouts.set(revenue * 0.7);
        
        // Recent orders
        this.recentOrders.set(
          orders.slice(0, 5).map((o) => ({
            id: o.id,
            total: o.totalPrice || o.total || 0,
            date: o.orderDate,
            status: o.status,
          }))
        );

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
