import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, EMPTY, finalize, interval, of, switchMap, tap } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { OrderNotificationService } from '../../../core/services/order-notification.service';
import { IOrder, OrderStatus } from '../../../models/iorder';

const TRACKING_POLL_MS = 15_000;

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css',
})
export class OrderTracking implements OnInit, OnDestroy {
  order: IOrder | null = null;
  loading = true;
  error = '';
  lastChecked: Date | null = null;

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

  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    const nav = history.state as { order?: IOrder };
    if (nav?.order) {
      this.order = this.orderService.normalizeOrder(nav.order);
      this.loading = false;
      this.notifications.notifyOrderTrackingViewed(this.order);
      this.startPolling();
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
          this.startPolling();
        },
      });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    if (!this.order || this.pollSub) return;
    if (this.isTerminalStatus(this.order.status)) return;

    const id = this.order.id;
    if (id === undefined || id === null) return;

    this.pollSub = interval(TRACKING_POLL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.orderService.getOrderById(id).pipe(catchError(() => of(null)))
        )
      )
      .subscribe((fresh) => {
        this.lastChecked = new Date();
        if (!fresh || !this.order) return;
        const prevStatus = String(this.order.status ?? '');
        const nextStatus = String(fresh.status ?? '');
        this.order = fresh;
        if (prevStatus !== nextStatus) {
          this.notifications.notifyOrderStatusChanged(fresh, prevStatus);
        }
        if (this.isTerminalStatus(fresh.status)) {
          this.stopPolling();
        }
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  private isTerminalStatus(status: string | undefined): boolean {
    const s = String(this.orderService.normalizeStatus(status ?? ''));
    return s === 'delivered' || s === 'cancelled';
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

  isLiveTracking(): boolean {
    return this.pollSub !== null && this.order !== null && !this.isTerminalStatus(this.order.status);
  }
}
