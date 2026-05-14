import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CartItem as SpecCartItem, CartResponse } from '../../models';
import { IProduct } from '../../models/iproduct';
import { AuthService } from './auth.service';

export interface CartItem {
  id: number;
  name: string;
  title: string;
  /** Effective billing price (actualPrice if available, else price) */
  price: number;
  quantity: number;
  image?: string;
  thumbnail?: string;
  images: string[];
  stock: number;
}

function pick<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function normalizeCartLine(raw: unknown, fallbackImage: string): CartItem {
  const o = asRecord(raw);
  const nested = asRecord(pick(o, ['product', 'Product']));

  const id = Number(pick(o, ['productId', 'ProductId', 'id', 'Id']) ?? pick(nested, ['id', 'Id']) ?? 0);
  const name = String(
    pick(o, ['productName', 'ProductName', 'name', 'Name', 'title', 'Title']) ??
    pick(nested, ['name', 'Name', 'title', 'Title']) ?? ''
  );
  const price = Number(
    pick(o, ['currentPrice', 'CurrentPrice', 'actualPrice', 'ActualPrice', 'price', 'Price', 'unitPrice', 'UnitPrice']) ??
    pick(nested, ['currentPrice', 'CurrentPrice', 'actualPrice', 'ActualPrice', 'price', 'Price']) ?? 0
  );
  const quantity = Number(pick(o, ['quantity', 'Quantity', 'qty', 'Qty']) ?? 1);
  const img = pick<string>(o, ['image', 'Image', 'imageUrl', 'ImageUrl', 'thumbnail', 'Thumbnail']) ??
    pick<string>(nested, ['image', 'Image', 'imageUrl', 'ImageUrl']);
  const images = img ? [img] : [fallbackImage];
  const stock = Number(
    pick(o, ['stockQuantity', 'StockQuantity', 'stock', 'Stock']) ??
    pick(nested, ['stockQuantity', 'StockQuantity']) ?? 999
  );
  return { id, name, title: name, price, quantity, image: img, thumbnail: img, images, stock };
}

function normalizeSpecCartItem(raw: unknown): SpecCartItem {
  const o = asRecord(raw);
  const productId = Number(pick(o, ['productId', 'ProductId', 'id', 'Id']) ?? 0);
  const productName = String(pick(o, ['productName', 'ProductName', 'name', 'Name']) ?? '');
  const originalPrice = Number(pick(o, ['originalPrice', 'OriginalPrice', 'price', 'Price']) ?? 0);
  const currentPrice = Number(
    pick(o, ['currentPrice', 'CurrentPrice', 'actualPrice', 'ActualPrice']) ?? originalPrice
  );
  const quantity = Number(pick(o, ['quantity', 'Quantity']) ?? 1);
  const totalItemPrice = Number(
    pick(o, ['totalItemPrice', 'TotalItemPrice']) ?? currentPrice * quantity
  );
  return {
    id: Number(pick(o, ['id', 'Id']) ?? productId),
    productId,
    productName,
    originalPrice,
    currentPrice,
    quantity,
    totalItemPrice,
  };
}

function extractRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = asRecord(raw);
  if (Array.isArray(r['$values'])) return r['$values'] as unknown[];
  const candidates = ['cartItems', 'CartItems', 'items', 'Items', 'data', 'Data', 'result', 'Result', 'value', 'Value'];
  for (const key of candidates) {
    const v = r[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      const inner = asRecord(v);
      for (const k2 of candidates) {
        if (Array.isArray(inner[k2])) return inner[k2] as unknown[];
      }
      if (Array.isArray(inner['$values'])) return inner['$values'] as unknown[];
    }
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/ShoppingCart`;

  private items: CartItem[] = [];
  /**
   * Tracks productIds the backend already has a CartItems row for.
   * Workaround for the API's Add_To_Cart inserting a new row on every call
   * (which makes CheckOut throw DbUpdateConcurrencyException at the second
   * stock-decrement). We never POST the same productId twice; subsequent
   * adds and increments only update the local cart.
   */
  private serverProductIds = new Set<number>();
  private readonly fallbackImg =
    'data:image/svg+xml,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8e8ed"/></svg>');

  private itemCountSubject = new BehaviorSubject<number>(0);
  itemCountObservable$ = this.itemCountSubject.asObservable();

  private get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private emitQty(): void {
    this.itemCountSubject.next(this.items.reduce((s, i) => s + i.quantity, 0));
  }

  /** Spec API — POST /api/ShoppingCart/Add_To_Cart?ProductId=&Quantity= */
  addToCart(productId: number, quantity: number): Observable<any>;
  addToCart(product: IProduct, quantity?: number): void;
  addToCart(arg: number | IProduct, quantity: number = 1): Observable<any> | void {
    if (typeof arg === 'number') {
      if (this.serverProductIds.has(arg)) {
        return of(null);
      }
      return this._syncAddToApi(arg, quantity).pipe(
        tap(() => this.serverProductIds.add(arg))
      );
    }
    const product = arg;
    const existing = this.items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push(this.lineFromProduct(product, quantity));
    }
    this.emitQty();
    if (this.isLoggedIn && !this.serverProductIds.has(product.id)) {
      this._syncAddToApi(product.id, quantity).subscribe({
        next: () => this.serverProductIds.add(product.id),
        error: () => { },
      });
    }
  }

  /** Spec API — GET /api/ShoppingCart/Get_Cart_Items */
  getCart(): Observable<CartResponse> {
    return this.http.get<unknown>(`${this.apiUrl}/Get_Cart_Items`).pipe(
      map((raw) => {
        const rows = extractRows(raw).map(normalizeSpecCartItem);
        const r = asRecord(raw);
        const totalPrice = Number(
          pick(r, ['totalPrice', 'TotalPrice', 'total', 'Total']) ??
            rows.reduce((s, i) => s + i.totalItemPrice, 0)
        );
        return { items: rows, totalPrice } as CartResponse;
      })
    );
  }

  // --- Legacy/compatibility helpers used by existing components ---

  private lineFromProduct(product: IProduct, quantity: number): CartItem {
    const billingPrice = product.actualPrice ?? product.price;
    const img = product.image?.trim();
    const images = img ? [img] : [this.fallbackImg];
    return {
      id: product.id,
      name: product.name,
      title: product.name,
      price: billingPrice,
      quantity,
      image: product.image,
      thumbnail: product.image,
      images,
      stock: product.stockQuantity,
    };
  }

  private _syncAddToApi(productId: number, quantity: number): Observable<unknown> {
    const params = new HttpParams().set('ProductId', productId).set('Quantity', quantity);
    return this.http.post(`${this.apiUrl}/Add_To_Cart`, null, { params });
  }

  loadCartFromApi(): Observable<CartItem[]> {
    return this.http.get<unknown>(`${this.apiUrl}/Get_Cart_Items`).pipe(
      map((raw) => extractRows(raw).map((r) => normalizeCartLine(r, this.fallbackImg))),
      tap((items) => {
        this.items = items ?? [];
        this.serverProductIds = new Set(this.items.map((i) => i.id));
        this.emitQty();
      })
    );
  }

  getItems(): CartItem[] {
    return this.items;
  }
  getTotalPrice(): number {
    return this.items.reduce((t, i) => t + i.price * i.quantity, 0);
  }
  getItemCount(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  }

  incrementItem(productId: number): void {
    const item = this.items.find((i) => i.id === productId);
    if (!item) return;
    item.quantity++;
    this.emitQty();
    // Do NOT POST again — the API inserts a new row on every call.
    // Local-only quantity bumps avoid the duplicate-cart-row bug that
    // crashes CheckOut on the second stock update.
  }

  decrementItem(productId: number): void {
    const item = this.items.find((i) => i.id === productId);
    if (!item) return;
    item.quantity > 1 ? item.quantity-- : this.removeItem(productId);
    this.emitQty();
  }

  removeItem(productId: number): void {
    this.items = this.items.filter((i) => i.id !== productId);
    this.serverProductIds.delete(productId);
    this.emitQty();
  }
  clearCart(): void {
    this.items = [];
    this.serverProductIds.clear();
    this.emitQty();
  }
}
