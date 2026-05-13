import { Component, OnInit } from '@angular/core';
import { CartService } from "../../services/cart.service";
import { CommonModule } from '@angular/common';
import { DecimalPipe } from "../../pipes/decimal-pipe";
import { RouterLink }         from '@angular/router';          // ✅ added for routerLink="/checkout"
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/AuthServices/auth-service';
import { Router } from '@angular/router';
import { IProduct } from '../../models/iproduct';

@Component({
  selector:    'app-cart',
  imports:     [CommonModule, DecimalPipe, RouterLink],         // ✅ RouterLink added
  templateUrl: './cart.html',
  styleUrl:    './cart.css',
})
export class Cart implements OnInit {

  cartItems: any[] = [];

  constructor(
    public cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.cartService.loadCartFromApi().subscribe({
        next: () => this.syncItems(),
        error: () => this.syncItems(),
      });
    } else {
      this.syncItems();
    }
  }

  private syncItems(): void {
    this.cartItems = this.cartService.getItems();
  }

  get totalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  increment(productId: number) {
    this.cartService.incrementItem(productId);
    this.syncItems();
  }

  decrement(productId: number) {
    this.cartService.decrementItem(productId);
    this.syncItems();
  }

  remove(productId: number) {
    this.cartService.removeItem(productId);
    this.syncItems();
  }

  clearCart() {
    this.cartService.clearCart();
    this.cartItems = [];
  }

  // 💖 Wishlist logic
  toggleWishlist(productId: number) {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlistService.toggleWishlist(productId).subscribe();
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}