import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { OrderTracking } from './order-tracking';
import { OrderService } from '../../../core/services/order.service';
import { OrderNotificationService } from '../../../core/services/order-notification.service';

describe('OrderTracking', () => {
  let component: OrderTracking;
  let fixture: ComponentFixture<OrderTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTracking],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => (k === 'id' ? '1' : null) } },
          },
        },
        {
          provide: OrderService,
          useValue: {
            getOrderById: () =>
              of({
                id: 1,
                status: 'pending',
                items: [],
                total: 0,
              }),
            normalizeOrder: (o: unknown) => o,
            normalizeStatus: (s: string | null | undefined) =>
              String(s ?? 'pending')
                .trim()
                .toLowerCase(),
          },
        },
        {
          provide: OrderNotificationService,
          useValue: { notifyOrderTrackingViewed: () => { } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTracking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});