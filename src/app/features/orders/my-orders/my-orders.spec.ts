import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MyOrders } from './my-orders';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

describe('MyOrders', () => {
  let component: MyOrders;
  let fixture: ComponentFixture<MyOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyOrders],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({ id: '1', firstName: 'A', lastName: 'B', email: 'a@b.c', password: '', role: 'Customer' }),
            isLoggedIn: () => true,
            isAdmin: () => false,
          },
        },
        {
          provide: OrderService,
          useValue: {
            getMyOrders: () => of([]),
            getMyOrdersExtended: () => of([]),
            getAllOrders: () => of([]),
            sortOrdersDesc: (o: unknown[]) => o ?? [],
            updateOrderStatusWithNotify: () => of({}),
            normalizeStatus: (s: string) => s,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyOrders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});