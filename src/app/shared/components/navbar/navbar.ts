import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IUser } from '../../../models/iuser';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {

  cartItemCount = 0;
  currentUser: IUser | null = null;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    public cartService: CartService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    // Use markForCheck so Angular re-checks this component whenever the count changes,
    // avoiding ExpressionChangedAfterItHasBeenCheckedError
    this.cartService.itemCountObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.cartItemCount = count;
        this.cdr.markForCheck();
      });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        // Defer the API call one tick so it doesn't mutate state
        // during Angular's current change-detection pass
        setTimeout(() => {
          if (user && this.authService.isLoggedIn()) {
            this.cartService.loadCartFromApi().subscribe({ error: () => { } });
          } else {
            this.cartService.clearCart();
          }
        });
      });
  }

  logout(): void {
    this.authService.logout();
  }
}