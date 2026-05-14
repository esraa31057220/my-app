import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CheckoutResponse, Order } from '../../models';
import { IOrder, IOrderLineItem, OrderStatus } from '../../models/iorder';
import { IProduct } from '../../models/iproduct';
import { OrderNotificationService } from './order-notification.service';
import { ProductService } from './product.service';

export interface PlaceOrderMeta {
  address: string;
  city: string;
  phone: string;
  paymentMethod: 'cash' | 'card';
  userName: string;
  cartLineTotal: number;
  cartItems: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(OrderNotificationService);
  private readonly products = inject(ProductService);
  private readonly ordersUrl = `${environment.apiUrl}/Orders`;
  private readonly adminUrl = `${environment.apiUrl}/Admin`;

  /** Spec API — POST /api/Orders/CheckOut?shippingAddress= */
  checkout(shippingAddress: string): Observable<CheckoutResponse> {
    const params = new HttpParams().set('shippingAddress', shippingAddress);
    return this.http.post<unknown>(`${this.ordersUrl}/CheckOut`, null, { params }).pipe(
      map((raw) => this.normalizeCheckoutResponse(raw))
    );
  }

  /** Spec API — GET /api/Orders/My-Orders */
  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<unknown>(`${this.ordersUrl}/My-Orders`)
      .pipe(map((raw) => this.normalizeOrderList(this.asOrderArray(raw)) as unknown as Order[]));
  }

  // --- Legacy helpers (extended return types used by components) ---

  getOrdersByUserId(_userId: string | number): Observable<IOrder[]> {
    return this.getMyOrdersExtended();
  }

  getMyOrdersExtended(): Observable<IOrder[]> {
    return this.enrichOrdersWithProductImages(
      this.http
        .get<unknown>(`${this.ordersUrl}/My-Orders`)
        .pipe(map((raw) => this.normalizeOrderList(this.asOrderArray(raw))))
    );
  }

  getAllOrders(): Observable<IOrder[]> {
    return this.enrichOrdersWithProductImages(
      this.http
        .get<unknown>(`${this.adminUrl}/AllOrders`)
        .pipe(map((raw) => this.normalizeOrderList(this.asOrderArray(raw))))
    );
  }

  /**
   * The backend's order endpoints only return productId/productName/quantity/price
   * — no image. Join each order line against the products catalog so the UI can
   * render thumbnails on /my-orders, /order/:id/tracking and /order/:id/confirmation.
   */
  private enrichOrdersWithProductImages(orders$: Observable<IOrder[]>): Observable<IOrder[]> {
    return forkJoin({
      orders: orders$,
      products: this.products.getProducts().pipe(catchError(() => of<IProduct[]>([]))),
    }).pipe(
      map(({ orders, products }) => {
        if (!products.length) return orders;
        const byId = new Map<number, IProduct>();
        for (const p of products) byId.set(Number(p.id), p);
        return orders.map((order) => ({
          ...order,
          items: (order.items ?? []).map((item) => ({
            ...item,
            thumbnail: item.thumbnail || this.productImageUrl(byId.get(Number(item.productId))?.image),
          })),
        }));
      })
    );
  }

  private productImageUrl(raw: string | undefined): string {
    const r = raw?.trim();
    if (!r) return '';
    if (/^https?:\/\//i.test(r)) return r;
    const env = environment as { apiUrl: string; apiServerOrigin?: string };
    const base = env.apiUrl.startsWith('http')
      ? env.apiUrl.replace(/\/api\/?$/, '')
      : (env.apiServerOrigin ?? '').replace(/\/$/, '');
    if (!base) {
      return r.startsWith('/') ? r : `/${r}`;
    }
    return r.startsWith('/') ? `${base}${r}` : `${base}/${r}`;
  }

  getOrderById(orderId: string | number): Observable<IOrder> {
    const idNum = Number(orderId);
    if (Number.isNaN(idNum)) {
      return throwError(() => new Error('INVALID_ORDER_ID'));
    }
    return this.getMyOrdersExtended().pipe(
      switchMap((orders) => {
        const hit = orders.find((o) => Number(o.id) === idNum);
        if (hit) return of(hit);
        return this.getAllOrders().pipe(
          map((all) => all.find((o) => Number(o.id) === idNum) ?? null),
          catchError(() => of(null)),
          switchMap((found) =>
            found ? of(found) : throwError(() => new Error('ORDER_NOT_FOUND'))
          )
        );
      })
    );
  }

  placeOrder(meta: PlaceOrderMeta): Observable<IOrder> {
    const shippingBlob = this.buildShippingBlob(meta);
    return this.checkoutRaw(shippingBlob).pipe(
      map((api) => this.normalizeOrder(api, meta)),
      map((order) => {
        this.notifications.notifyOrderPlaced(order);
        return order;
      })
    );
  }

  private checkoutRaw(shippingAddress: string): Observable<unknown> {
    const params = new HttpParams().set('shippingAddress', shippingAddress);
    return this.http.post<unknown>(`${this.ordersUrl}/CheckOut`, null, { params });
  }

  /** @deprecated use {@link placeOrder} */
  createOrder(order: IOrder): Observable<IOrder> {
    return this.checkoutRaw(order.shippingAddress ?? '').pipe(map((raw) => this.normalizeOrder(raw)));
  }

  updateOrderStatus(orderId: string | number, status: string): Observable<IOrder> {
    const idNum = Number(orderId);
    const pathId = Number.isFinite(idNum) ? idNum : orderId;
    const body = JSON.stringify(status);
    return this.http
      .put<unknown>(`${this.adminUrl}/UpdateOrderStatus/${pathId}`, body, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        map((raw) =>
          raw == null || raw === '' ? { id: orderId, status } : this.normalizeOrder(raw)
        )
      );
  }

  updateOrderStatusWithNotify(
    orderId: string | number,
    status: string,
    previousStatus?: string
  ): Observable<IOrder> {
    return this.updateOrderStatus(orderId, status).pipe(
      tap((order) => this.notifications.notifyOrderStatusChanged(order, previousStatus))
    );
  }

  normalizeStatus(status: string | undefined | null): OrderStatus | string {
    const s = (status ?? 'pending').toString().trim().toLowerCase();
    const mapLegacy: Record<string, OrderStatus> = {
      pending: 'pending',
      placed: 'pending',
      processing: 'confirmed',
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      canceled: 'cancelled',
    };
    return mapLegacy[s] ?? 'pending';
  }

  sortOrdersDesc(orders: IOrder[]): IOrder[] {
    return [...orders].sort((a, b) => {
      const tA = this.orderTimestamp(a);
      const tB = this.orderTimestamp(b);
      return tB - tA;
    });
  }

  private orderTimestamp(o: IOrder): number {
    const d = o.createdAt ?? o.orderDate;
    return d ? new Date(d as string).getTime() : 0;
  }

  private buildShippingBlob(meta: PlaceOrderMeta): string {
    return [
      `ADDR:${meta.address.trim()}`,
      `CITY:${meta.city.trim()}`,
      `PHONE:${meta.phone.trim()}`,
      `PAY:${meta.paymentMethod}`,
    ].join('|');
  }

  private parseShippingBlob(raw: string | undefined): Partial<
    Pick<IOrder, 'address' | 'city' | 'phone' | 'paymentMethod'>
  > {
    const out: Partial<Pick<IOrder, 'address' | 'city' | 'phone' | 'paymentMethod'>> = {};
    if (!raw) return out;
    if (!raw.includes('ADDR:')) {
      out.address = raw;
      return out;
    }
    raw.split('|').forEach((seg) => {
      const idx = seg.indexOf(':');
      if (idx < 0) return;
      const key = seg.slice(0, idx).trim();
      const val = seg.slice(idx + 1).trim();
      if (key === 'ADDR') out.address = val;
      else if (key === 'CITY') out.city = val;
      else if (key === 'PHONE') out.phone = val;
      else if (key === 'PAY') out.paymentMethod = val as 'cash' | 'card';
    });
    return out;
  }

  private asOrderArray(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      const inner = r['data'] ?? r['items'] ?? r['orders'] ?? r['Orders'];
      if (Array.isArray(inner)) return inner;
    }
    return [];
  }

  private normalizeOrderList(raw: unknown[]): IOrder[] {
    return raw.map((o) => this.normalizeOrder(o));
  }

  normalizeOrder(raw: unknown, meta?: PlaceOrderMeta): IOrder {
    const o = (raw ?? {}) as Record<string, unknown>;
    const id = this.pickFirst<string | number>(o, 'id', 'Id', 'orderId', 'OrderId');
    const userId = this.pickFirst<string | number>(o, 'userId', 'UserId', 'customerId', 'CustomerId');
    const userName = this.pickFirst<string>(o, 'userName', 'UserName', 'customerName', 'CustomerName');
    const shippingAddress = this.pickFirst<string>(
      o,
      'shippingAddress',
      'ShippingAddress',
      'shppingAddress',
      'ShppingAddress',
      'deliveryAddress',
      'DeliveryAddress'
    );
    const orderDate = this.pickFirst<string | Date>(o, 'orderDate', 'OrderDate', 'createdAt', 'CreatedAt');
    const totalPrice = this.pickFirst<number>(o, 'totalPrice', 'TotalPrice', 'total', 'Total');
    const statusRaw = this.pickFirst<string>(o, 'status', 'Status', 'orderStatus', 'OrderStatus');
    const status = this.normalizeStatus(statusRaw) as string;

    const parsed = this.parseShippingBlob(shippingAddress);

    const itemsRawUnknown = this.pickFirst<unknown>(
      o,
      'items',
      'Items',
      'orderItems',
      'OrderItems',
      'lines',
      'Lines'
    );
    const itemsRaw = Array.isArray(itemsRawUnknown) ? itemsRawUnknown : undefined;
    let items = this.normalizeLineItems(itemsRaw);

    if ((!items || items.length === 0) && meta?.cartItems?.length) {
      items = meta.cartItems.map((c) => ({
        productId: c.id,
        productName: c.name,
        title: c.name,
        quantity: c.quantity,
        price: c.price,
        thumbnail: c.image,
      }));
    }

    const total =
      totalPrice ??
      meta?.cartLineTotal ??
      (items.length ? items.reduce((s, i) => s + i.price * i.quantity, 0) : 0);

    return {
      id,
      userId,
      userName: userName ?? meta?.userName,
      items,
      totalPrice: total,
      total,
      orderDate,
      createdAt: orderDate,
      status,
      shippingAddress,
      address: parsed.address ?? meta?.address,
      city: parsed.city ?? meta?.city,
      phone: parsed.phone ?? meta?.phone,
      paymentMethod: (parsed.paymentMethod as 'cash' | 'card') ?? meta?.paymentMethod,
    };
  }

  private normalizeCheckoutResponse(raw: unknown): CheckoutResponse {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const message = String(o['message'] ?? o['Message'] ?? '');
    const orderId = Number(o['orderId'] ?? o['OrderId'] ?? o['id'] ?? o['Id'] ?? 0);
    const total = Number(o['total'] ?? o['Total'] ?? o['totalPrice'] ?? o['TotalPrice'] ?? 0);
    return { message, orderId, total };
  }

  private normalizeLineItems(raw: unknown[] | undefined): IOrderLineItem[] {
    if (!raw?.length) return [];
    return raw.map((row) => {
      const r = row as Record<string, unknown>;
      const productId = Number(this.pickFirst(r, 'productId', 'ProductId', 'id', 'Id') ?? 0);
      const productName = String(
        this.pickFirst(r, 'productName', 'ProductName', 'name', 'Name', 'title', 'Title') ?? ''
      );
      const quantity = Number(this.pickFirst(r, 'quantity', 'Quantity', 'qty', 'Qty') ?? 0);
      const price = Number(
        this.pickFirst(
          r,
          'priceAtPurchase',
          'PriceAtPurchase',
          'price',
          'Price',
          'unitPrice',
          'UnitPrice'
        ) ?? 0
      );
      const thumbnail = String(
        this.pickFirst(r, 'thumbnail', 'Thumbnail', 'image', 'Image', 'imageUrl', 'ImageUrl') ?? ''
      );
      return {
        productId,
        productName,
        title: String(this.pickFirst(r, 'title', 'Title') ?? productName),
        quantity,
        price,
        thumbnail: thumbnail || undefined,
      };
    });
  }

  private pickFirst<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v as T;
    }
    return undefined;
  }
}
