import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../shared/services/user.service';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../shared/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../shared/services/wishlist.service';
import { IUser } from '../../../models/iuser';
import { IOrder } from '../../../models/iorder';
import { IReview } from '../../../models/ireview';
import { IProduct } from '../../../models/iproduct';
import { timeout, catchError, finalize, of } from 'rxjs';

/** UI-only fields used by userprofile.html (beyond IUser). */
export interface UserPaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
}

export type ProfileUser = IUser & {
  phone?: string;
  wishlist?: number[];
  paymentDetails?: UserPaymentDetails;
};

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './userprofile.html',
  styleUrl: './userprofile.css'
})
export class UserProfile implements OnInit {
  user: ProfileUser | null = null;
  isEditing = false;
  message = '';
  private messageTimer: any;

  activeTab: 'Account' | 'Orders' | 'Wishlist' | 'Reviews' = 'Account';

  userOrders: IOrder[] = [];
  wishlistProducts: IProduct[] = [];
  userReviews: IReview[] = [];

  ordersLoading = false;
  ordersError = '';

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private orderService: OrderService,
    private reviewService: ReviewService,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const u = currentUser as ProfileUser;
      this.user = {
        ...currentUser,
        phone: u.phone ?? currentUser.phoneNumber,
        paymentDetails: u.paymentDetails ?? {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardHolderName: '',
        },
      };
      this.loadTabData();
    }
  }

  setTab(tab: 'Account' | 'Orders' | 'Wishlist' | 'Reviews'): void {
    this.activeTab = tab;
    this.loadTabData();
  }

  loadTabData(): void {
    if (this.activeTab === 'Orders') {
      // Orders API uses JWT token — no user.id needed
      if (!this.authService.isLoggedIn()) {
        this.ordersError = 'Please log in to view your orders.';
        return;
      }

      this.userOrders = [];
      this.ordersError = '';
      this.ordersLoading = true;

      this.orderService
        .getMyOrdersExtended()
        .pipe(
          timeout(8000),
          catchError((err) => {
            this.ordersError =
              err?.name === 'TimeoutError'
                ? 'The orders service did not respond in time. Please try again.'
                : 'Could not load orders. Please try again later.';
            return of([]);
          }),
          finalize(() => {
            this.ordersLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (orders) => {
            this.userOrders = this.orderService.sortOrdersDesc(orders ?? []);
            this.cdr.detectChanges();
          },
        });

    } else if (this.activeTab === 'Wishlist') {
      if (!this.user?.id) return;
      this.wishlistProducts = [];
      if (this.user.wishlist?.length) {
        this.user.wishlist.forEach(id => {
          this.productService.getProductById(id).subscribe(product => {
            if (product) this.wishlistProducts.push(product);
            this.cdr.detectChanges();
          });
        });
      }

    } else if (this.activeTab === 'Reviews') {
      if (!this.user?.id) return;
      this.userReviews = [];
      this.reviewService.getReviewsByUserId(this.user.id).subscribe(reviews => {
        this.userReviews = reviews;
        this.cdr.detectChanges();
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.message = '';
    if (!this.isEditing) this.loadUser();
  }

  addToCart(product: IProduct): void {
    this.cartService.addToCart(product);
    this.showMessage(`Successfully added ${product.name} to your cart!`);
  }

  removeFromWishlist(productId: number): void {
    this.wishlistService.toggleWishlist(productId).subscribe(() => {
      this.wishlistProducts = this.wishlistProducts.filter(p => p.id !== productId);
      this.cdr.detectChanges();
    });
  }

  saveProfile(): void {
    if (!this.user) {
      this.message = 'User data is missing. Please re-login.';
      this.cdr.detectChanges();
      return;
    }

    const dtoUser = this.user as IUser;
    if (this.authService.isSeller()) {
      this.usersService
        .updateSellerProfile({
          firstName: dtoUser.firstName,
          lastName: dtoUser.lastName,
          address: dtoUser.address,
          phoneNumber: dtoUser.phoneNumber,
        })
        .subscribe({
          next: () => {
            this.authService.updateCurrentUser({
              ...dtoUser,
              wishlist: dtoUser.wishlist,
              paymentDetails: (this.user as ProfileUser).paymentDetails,
            });
            this.user = {
              ...dtoUser,
              phone: dtoUser.phoneNumber,
              paymentDetails: (this.user as ProfileUser).paymentDetails,
            } as ProfileUser;
            this.isEditing = false;
            this.showMessage('Profile updated successfully!');
          },
          error: () => {
            this.message = 'Failed to update profile. Please try again.';
            this.cdr.detectChanges();
          },
        });
      return;
    }

    this.authService.updateCurrentUser({
      ...dtoUser,
      wishlist: dtoUser.wishlist,
      paymentDetails: (this.user as ProfileUser).paymentDetails,
    });
    this.user = {
      ...dtoUser,
      phone: dtoUser.phoneNumber,
      paymentDetails: (this.user as ProfileUser).paymentDetails,
    } as ProfileUser;
    this.isEditing = false;
    this.showMessage('Profile updated successfully!');
  }

  private showMessage(msg: string): void {
    this.message = msg;
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.cdr.detectChanges();
    this.messageTimer = setTimeout(() => {
      this.message = '';
      this.cdr.detectChanges();
    }, 5000);
  }
}