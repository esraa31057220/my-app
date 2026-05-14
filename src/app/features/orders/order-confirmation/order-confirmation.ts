import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { OrderNotificationService } from '../../../core/services/order-notification.service';
import { IOrder } from '../../../models/iorder';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmation implements OnInit {
  order: IOrder | null = null;
  loading = true;
  error = '';

  shareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly notifications = inject(OrderNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const nav = history.state as { order?: IOrder };
    if (nav?.order) {
      this.order = this.orderService.normalizeOrder(nav.order);
      this.loading = false;
      this.notifications.notifyOrderConfirmationViewed(this.order);
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
        tap((o) => this.notifications.notifyOrderConfirmationViewed(o)),
        catchError(() => {
          this.error = 'Could not load your order.';
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

  shareUrl(): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/order/${this.order?.id}/confirmation`;
  }

  shareText(): string {
    const id = this.order?.id ?? '';
    const total = this.order?.totalPrice ?? 0;
    return `I just placed order #${id} on ShopHub — total $${total.toFixed(2)}!`;
  }

  shareNative(): void {
    if (!this.shareSupported || !this.order) return;
    navigator
      .share({
        title: `Order #${this.order.id}`,
        text: this.shareText(),
        url: this.shareUrl(),
      })
      .catch(() => {
        /* user cancelled or share unavailable */
      });
  }

  shareTwitter(): string {
    const text = encodeURIComponent(this.shareText());
    const url = encodeURIComponent(this.shareUrl());
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }

  shareFacebook(): string {
    const url = encodeURIComponent(this.shareUrl());
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }

  shareWhatsApp(): string {
    const text = encodeURIComponent(`${this.shareText()} ${this.shareUrl()}`);
    return `https://wa.me/?text=${text}`;
  }

  copyLink(): void {
    const url = this.shareUrl();
    if (!url || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copied.set(true);
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => {
        /* clipboard unavailable */
      });
  }
}