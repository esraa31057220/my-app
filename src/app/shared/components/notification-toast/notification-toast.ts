import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { OrderNotificationService } from '../../../core/services/order-notification.service';
import { OrderService } from '../../../core/services/order.service';

interface ToastItem {
  id: number;
  icon: string;
  title: string;
  body: string;
  tone: 'success' | 'info' | 'warning';
}

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  shipped: '🚚',
  delivered: '🎉',
  cancelled: '❌',
};

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.css',
})
export class NotificationToast implements OnInit, OnDestroy {
  private readonly notifications = inject(OrderNotificationService);
  private readonly orderService = inject(OrderService);
  private subs: Subscription[] = [];
  private autoCloseTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  toasts = signal<ToastItem[]>([]);

  ngOnInit(): void {
    this.subs.push(
      this.notifications.orderPlaced$.subscribe((order) => {
        this.push({
          icon: '🛍️',
          title: `Order #${order.id} placed`,
          body: 'We received your order and will start preparing it shortly.',
          tone: 'success',
        });
      })
    );

    this.subs.push(
      this.notifications.orderStatusChanged$.subscribe(({ order, previousStatus }) => {
        const status = String(this.orderService.normalizeStatus(order.status));
        const prev = previousStatus
          ? String(this.orderService.normalizeStatus(previousStatus))
          : '';
        if (prev === status) return;
        this.push({
          icon: STATUS_ICONS[status] ?? '📦',
          title: `Order #${order.id} \u2014 ${this.titleize(status)}`,
          body: this.statusBody(status),
          tone: status === 'cancelled' ? 'warning' : 'info',
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.autoCloseTimers.forEach((t) => clearTimeout(t));
    this.autoCloseTimers.clear();
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
    const t = this.autoCloseTimers.get(id);
    if (t) {
      clearTimeout(t);
      this.autoCloseTimers.delete(id);
    }
  }

  private push(partial: Omit<ToastItem, 'id'>): void {
    const id = this.nextId++;
    const item: ToastItem = { id, ...partial };
    this.toasts.update((list) => [...list, item].slice(-4));
    const timer = setTimeout(() => this.dismiss(id), 6000);
    this.autoCloseTimers.set(id, timer);
  }

  private titleize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private statusBody(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Your order is confirmed and being prepared.';
      case 'shipped':
        return 'Your order is on its way!';
      case 'delivered':
        return 'Your order has been delivered. Enjoy!';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Status updated.';
    }
  }
}
