import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Checkout } from './checkout';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';

let placeOrderCalled = false;

const mockCartService = {
  getItemCount: () => 1,
  getItems: () => [
    { id: 1, name: 'Product', price: 10, quantity: 1, image: '' },
  ],
  getTotalPrice: () => 10,
  clearCart: () => { },
};

const mockOrderService = {
  placeOrder() {
    placeOrderCalled = true;
    return of({ id: 'order-123' });
  },
};

const mockAuthService = {
  getCurrentUser: () => ({
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    role: 'Customer',
    password: '',
  }),
  currentUser$: of(null),
};

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;

  beforeEach(async () => {
    placeOrderCalled = false;
    await TestBed.configureTestingModule({
      imports: [Checkout, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: mockCartService },
        { provide: OrderService, useValue: mockOrderService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init form with default paymentMethod = cash', () => {
    expect(component.form.get('paymentMethod')?.value).toBe('cash');
  });

  it('should not place order if form is invalid', () => {
    placeOrderCalled = false;
    component.placeOrder();
    expect(placeOrderCalled).toBeFalsy();
  });

  it('should set submitting=false after successful order', () => {
    component.form.setValue({
      address: 'Cairo, Maadi, Street 9',
      city: 'Cairo',
      phone: '01012345678',
      paymentMethod: 'cash',
    });
    component.placeOrder();
    expect(component.submitting).toBeFalsy();
  });
});