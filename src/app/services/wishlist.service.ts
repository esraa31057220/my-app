import { Injectable, inject } from '@angular/core';
import { AuthService } from './AuthServices/auth-service';
import { IUser } from '../models/iuser';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private authService = inject(AuthService);

  toggleWishlist(productId: number): Observable<IUser | null> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    if (!user.wishlist) user.wishlist = [];

    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    this.authService.updateCurrentUser(user);
    return of(user);
  }

  isInWishlist(productId: number): boolean {
    const user = this.authService.getCurrentUser();
    return user?.wishlist?.includes(productId) || false;
  }
}
