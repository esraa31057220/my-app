import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, Observable, of, switchMap } from 'rxjs';
import { catchError, finalize, map, startWith } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { IOrder } from '../../../models/iorder';

interface OrdersViewState {
  loading: boolean;
  error: string;
  orders: IOrder[];
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
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

  /** Local cache of the last-loaded orders so admin status changes can mutate it without re-fetching. */
  private readonly ordersCache$ = new BehaviorSubject<IOrder[]>([]);

  /** Single source of truth consumed via async pipe — no manual subscription needed. */
  readonly state$: Observable<OrdersViewState> = this.buildInitialFetch$();

  private buildInitialFetch$(): Observable<OrdersViewState> {
    if (!this.authService.isLoggedIn()) {
      return of({ loading: false, error: 'Please log in to view your orders.', orders: [] });
    }
    const source$ = this.authService.isAdmin()
      ? this.orderService.getAllOrders()
      : this.orderService.getMyOrdersExtended();

    return source$.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((orders) => this.orderService.sortOrdersDesc(orders ?? [])),
      switchMap((orders) => {
        this.ordersCache$.next(orders);
        return this.ordersCache$.pipe(
          map((latest) => ({ loading: false, error: '', orders: latest })),
        );
      }),
      catchError(() => of({ loading: false, error: 'Could not load orders. Please try again later.', orders: [] as IOrder[] })),
      startWith({ loading: true, error: '', orders: [] as IOrder[] }),
    );
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
        }),
      )
      .subscribe({
        next: (updated) => {
          const current = this.ordersCache$.value;
          const i = current.findIndex((o) => String(o.id) === String(id));
          if (i >= 0) {
            const next = [...current];
            next[i] = { ...next[i], ...updated };
            this.ordersCache$.next(next);
          }
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
