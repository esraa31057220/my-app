import { Component, OnInit, inject, DestroyRef } from '@angular/core';
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
}