import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/AuthServices/auth-service';
import { IOrder } from '../../models/iorder';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders implements OnInit {
  orders: IOrder[] = [];
  ordersLoading = false;
  ordersError = '';
  statusUpdatingId: string | number | null = null;

  readonly adminStatusOptions: string[] = [
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
  ];

  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Use isLoggedIn() — the orders API authenticates via JWT token, not by user id
    if (!this.authService.isLoggedIn()) {
      this.ordersError = 'Please log in to view your orders.';
      return;
    }
    this.loadOrders();
  }

  loadOrders(): void {
    this.ordersLoading = true;
    this.ordersError = '';

    const source$ = this.authService.isAdmin()
      ? this.orderService.getAllOrders()
      : this.orderService.getMyOrders();

    source$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.ordersError = 'Could not load orders. Please try again later.';
          return EMPTY;
        }),
        finalize(() => {
          this.ordersLoading = false;
        })
      )
      .subscribe({
        next: (orders) => {
          this.orders = this.orderService.sortOrdersDesc(orders ?? []);
        },
      });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  displayStatus(status: string | undefined): string {
    return String(this.orderService.normalizeStatus(status ?? ''));
  }

  onAdminStatusChange(order: IOrder, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const next = select.value;
    const prev = String(order.status ?? '');
    const id = order.id;
    if (id == null) return;

    this.statusUpdatingId = id;
    this.orderService
      .updateOrderStatusWithNotify(id, next, prev)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          select.value = this.displayStatus(prev);
          return EMPTY;
        }),
        finalize(() => {
          this.statusUpdatingId = null;
        })
      )
      .subscribe({
        next: (updated) => {
          const i = this.orders.findIndex((o) => String(o.id) === String(id));
          if (i >= 0) this.orders[i] = { ...this.orders[i], ...updated };
        },
      });
  }

  statusClass(status: string | undefined): string {
    const s = this.displayStatus(status);
    const map: Record<string, string> = {
      pending: 'tag--orange',
      confirmed: 'tag--blue',
      shipped: 'tag--purple',
      delivered: 'tag--green',
      cancelled: 'tag--red',
    };
    return map[s] ?? 'tag--blue';
  }

  statusIcon(status: string | undefined): string {
    const s = this.displayStatus(status);
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✅',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '❌',
    };
    return icons[s] ?? '📦';
  }
}