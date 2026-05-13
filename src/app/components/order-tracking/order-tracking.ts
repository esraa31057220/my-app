import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { OrderNotificationService } from '../../services/order-notification.service';
import { IOrder, OrderStatus } from '../../models/iorder';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css',
})
export class OrderTracking implements OnInit {
  order: IOrder | null = null;
  loading = true;
  error = '';

  readonly steps: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

  readonly stepMeta: Record<string, { icon: string; label: string; desc: string }> = {
    pending: { icon: '⏳', label: 'Order Placed', desc: 'We received your order and are reviewing it.' },
    confirmed: { icon: '✅', label: 'Confirmed', desc: 'Your order is confirmed and being prepared.' },
    shipped: { icon: '🚚', label: 'Shipped', desc: 'Your order is on its way!' },
    delivered: { icon: '🎉', label: 'Delivered', desc: 'Your order has been delivered. Enjoy!' },
  };

  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly notifications = inject(OrderNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const nav = history.state as { order?: IOrder };
    if (nav?.order) {
      this.order = this.orderService.normalizeOrder(nav.order);
      this.loading = false;
      this.notifications.notifyOrderTrackingViewed(this.order);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Order not found.';
      this.loading = false;
      return;
    }

    this.orderService
      .getOrderById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((o) => this.notifications.notifyOrderTrackingViewed(o)),
        catchError(() => {
          this.error = 'Could not load order.';
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (o) => {
          this.order = o;
        },
      });
  }

  isReached(step: OrderStatus): boolean {
    if (!this.order) return false;
    const current = String(this.orderService.normalizeStatus(this.order.status)) as OrderStatus;
    const curIdx = this.steps.includes(current) ? this.steps.indexOf(current) : 0;
    return this.steps.indexOf(step) <= curIdx;
  }

  isCurrent(step: OrderStatus): boolean {
    if (!this.order) return false;
    return String(this.orderService.normalizeStatus(this.order.status)) === step;
  }

  isCancelledState(): boolean {
    if (!this.order) return false;
    return this.orderService.normalizeStatus(this.order.status) === 'cancelled';
  }
}