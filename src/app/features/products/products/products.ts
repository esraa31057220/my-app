import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { HighLight } from '../../../shared/directives/high-light';
import { TruncateWordsPipe } from '../../../shared/pipes/truncate-words-pipe';
import { ZoomImageDirective } from '../../../shared/directives/zoom-image';
import { ProductService, ProductQueryParams } from '../../../core/services/product.service';
import { IProduct } from '../../../models/iproduct';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { DecimalPipe } from '../../../shared/pipes/decimal-pipe';
import { Router } from '@angular/router';
import { WishlistService } from '../../../shared/services/wishlist.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-products',
  imports: [CommonModule, HighLight, TruncateWordsPipe, ZoomImageDirective, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
  standalone: true,
})
export class Products implements OnInit, OnChanges {
  @Input() selectedCategory: string = 'All';
  @Input() selectedCategoryId: number | null = null;
  @Input() maxPrice: number = 1000;
  @Input() searchQuery: string = '';

  @Output() totalPrice = new EventEmitter<number>();

  @Output() editProduct = new EventEmitter<IProduct>();
  @Output() deleteProduct = new EventEmitter<number>();

  products: IProduct[] = [];
  loading = false;
  error = '';

  readonly imageFallback =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320"><rect width="100%" height="100%" fill="#e8e8ed"/></svg>'
    );

  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadProducts();
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.detectChanges());
  }

  ngOnChanges(changes: SimpleChanges): void {
    const keys = ['selectedCategoryId', 'maxPrice', 'searchQuery', 'selectedCategory'] as const;
    const shouldReload = keys.some(
      (k) => changes[k] && !changes[k]!.firstChange
    );
    if (shouldReload) {
      this.loadProducts();
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    const query: ProductQueryParams = {};
    const q = this.searchQuery?.trim();
    if (q) query.Search = q;
    if (this.maxPrice < 1000) query.MaxPrice = this.maxPrice;
    if (this.selectedCategoryId != null) query.CategoryId = this.selectedCategoryId;

    this.productService
      .getProducts(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error = 'Failed to load products.';
          this.products = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.products = data ?? [];
        },
      });
  }

  productImageUrl(p: IProduct): string {
    const raw = p.image?.trim();
    if (!raw) return this.imageFallback;
    if (/^https?:\/\//i.test(raw)) return raw;
    const env = environment as { apiUrl: string; apiServerOrigin?: string };
    const base = env.apiUrl.startsWith('http')
      ? env.apiUrl.replace(/\/api\/?$/, '')
      : (env.apiServerOrigin ?? '').replace(/\/$/, '');
    if (!base) {
      return raw.startsWith('/') ? raw : `/${raw}`;
    }
    return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
  }

  get filteredProducts(): IProduct[] {
    return this.products;
  }

  get inStockCount(): number {
    return this.filteredProducts.filter((p) => p.stockQuantity > 0).length;
  }

  onEdit(product: IProduct): void {
    this.editProduct.emit(product);
  }
  onDelete(id: number): void {
    this.deleteProduct.emit(id);
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  toggleWishlist(productId: number): void {
    if (!this.isLoggedIn()) {
      this.goToLogin();
      return;
    }
    this.wishlistService
      .toggleWishlist(productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY)
      )
      .subscribe(() => this.cdr.detectChanges());
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}