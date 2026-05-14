import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError, EMPTY } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  form!: FormGroup;
  submitting = false;
  error = '';

  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.cartService.getItemCount() === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.form = new FormGroup({
      address: new FormControl('', [Validators.required, Validators.minLength(10)]),
      city: new FormControl('', Validators.required),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^(010|011|012|015)\d{8}$/),
      ]),
      paymentMethod: new FormControl<'cash' | 'card'>('cash', Validators.required),
    });
  }

  get f() {
    return this.form.controls;
  }
  get cartItems() {
    return this.cartService.getItems();
  }
  get total() {
    return this.cartService.getTotalPrice();
  }

  placeOrder(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting) return;

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.error = '';

    const meta = {
      address: this.f['address'].value.trim(),
      city: this.f['city'].value.trim(),
      phone: this.f['phone'].value.trim(),
      paymentMethod: this.f['paymentMethod'].value as 'cash' | 'card',
      userName: `${user.firstName} ${user.lastName}`.trim(),
      cartLineTotal: this.total,
      cartItems: this.cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image ?? i.thumbnail,
      })),
    };

    this.orderService
      .placeOrder(meta)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error = 'Could not place your order. Please try again.';
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (created) => {
          this.cartService.clearCart();
          this.router.navigate(['/order', created.id, 'confirmation'], {
            state: { order: created },
          });
        },
      });
  }
}