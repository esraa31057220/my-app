import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsersService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { SellerStatsService } from '../services/seller-stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private usersService = inject(UsersService);
  private products = inject(ProductService);
  private orders = inject(OrderService);
  private seller = inject(SellerStatsService);

  loading = signal(true);
  userCount = signal(0);
  orderCount = signal(0);
  productCount = signal(0);
  categoryCount = signal(0);
  salesSnapshot = signal<unknown>(null);
  lowStock = signal<unknown>(null);
  topSelling = signal<unknown>(null);

  ngOnInit(): void {
    forkJoin({
      users: this.usersService.getUsers().pipe(catchError(() => of([]))),
      orders: this.orders.getAllOrders().pipe(catchError(() => of([]))),
      products: this.products.getProducts().pipe(catchError(() => of([]))),
      categories: this.products.getCategories().pipe(catchError(() => of([]))),
      sales: this.seller.salesStatus().pipe(catchError(() => of(null))),
      low: this.seller.lowStockAlert().pipe(catchError(() => of(null))),
      top: this.seller.topSelling().pipe(catchError(() => of(null))),
    }).subscribe({
      next: (r) => {
        this.userCount.set(Array.isArray(r.users) ? r.users.length : 0);
        this.orderCount.set(Array.isArray(r.orders) ? r.orders.length : 0);
        this.productCount.set(Array.isArray(r.products) ? r.products.length : 0);
        this.categoryCount.set(Array.isArray(r.categories) ? r.categories.length : 0);
        this.salesSnapshot.set(r.sales);
        this.lowStock.set(r.low);
        this.topSelling.set(r.top);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
