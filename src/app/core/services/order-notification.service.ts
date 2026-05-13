import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IOrder } from '../../models/iorder';

export interface OrderStatusChangeEvent {
  order: IOrder;
  previousStatus?: string;
}

/**
 * Extension points for transactional email, SMS, or push.
 * Subscribe from app-level providers or background workers.
 */
@Injectable({ providedIn: 'root' })
export class OrderNotificationService {
  readonly orderPlaced$ = new Subject<IOrder>();
  readonly orderStatusChanged$ = new Subject<OrderStatusChangeEvent>();
  readonly orderConfirmationViewed$ = new Subject<IOrder>();
  readonly orderTrackingViewed$ = new Subject<IOrder>();

  notifyOrderPlaced(order: IOrder): void {
    this.orderPlaced$.next(order);
  }

  notifyOrderStatusChanged(order: IOrder, previousStatus?: string): void {
    this.orderStatusChanged$.next({ order, previousStatus });
  }

  notifyOrderConfirmationViewed(order: IOrder): void {
    this.orderConfirmationViewed$.next(order);
  }

  notifyOrderTrackingViewed(order: IOrder): void {
    this.orderTrackingViewed$.next(order);
  }
}
