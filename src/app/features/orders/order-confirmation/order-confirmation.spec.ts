import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { OrderConfirmation } from './order-confirmation';
import { OrderService } from '../../../core/services/order.service';
import { OrderNotificationService } from '../../../core/services/order-notification.service';

describe('OrderConfirmation', () => {
  let component: OrderConfirmation;
  let fixture: ComponentFixture<OrderConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderConfirmation],
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
            getOrderById: () => of({ id: 1, status: 'pending', items: [], total: 0 }),
            normalizeOrder: (o: unknown) => o,
          },
        },
        {
          provide: OrderNotificationService,
          useValue: { notifyOrderConfirmationViewed: () => { } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});