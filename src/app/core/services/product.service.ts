import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product, ProductFilter } from '../../models';
import { IProduct, IProductFormData } from '../../models/iproduct';

export interface ProductQueryParams {
  Search?: string;
  CategoryId?: number;
  MinPrice?: number;
  MaxPrice?: number;
  Sort?: string;
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

/** Resolve a possibly-relative backend image path to an absolute URL the browser can load. */
function resolveProductImage(raw: string | undefined): string | undefined {
  const r = raw?.trim();
  if (!r) return undefined;
  if (/^https?:\/\//i.test(r) || r.startsWith('data:')) return r;
  const env = environment as { apiUrl: string; apiServerOrigin?: string };
  const base = env.apiUrl.startsWith('http')
    ? env.apiUrl.replace(/\/api\/?$/, '')
    : (env.apiServerOrigin ?? '').replace(/\/$/, '');
  if (!base) return r.startsWith('/') ? r : `/${r}`;
  return r.startsWith('/') ? `${base}${r}` : `${base}/${r}`;
}

function normalizeProduct(raw: unknown): IProduct {
  const o = asRecord(raw);

  const rawImage = pick<string>(o, [
    'imagePath', 'ImagePath',
    'image', 'Image',
    'imageUrl', 'ImageUrl',
    'thumbnail', 'Thumbnail',
    'photo', 'Photo',
  ]);
  const imagePath = resolveProductImage(rawImage);

  return {
    id: Number(pick(o, ['id', 'Id', 'productId', 'ProductId']) ?? 0),
    name: String(pick(o, ['name', 'Name', 'title', 'Title', 'productName', 'ProductName']) ?? ''),
    description: String(pick(o, ['description', 'Description']) ?? ''),
    price: Number(pick(o, ['price', 'Price', 'unitPrice', 'UnitPrice']) ?? 0),
    actualPrice: pick<number>(o, ['actualPrice', 'ActualPrice', 'currentPrice', 'CurrentPrice', 'discountedPrice', 'DiscountedPrice']),
    stockQuantity: Number(pick(o, ['stockQuantity', 'StockQuantity', 'stock', 'Stock', 'quantity', 'Quantity']) ?? 0),
    imagePath,
    image: imagePath,
    categoryId: Number(pick(o, ['categoryId', 'CategoryId']) ?? 0),
    categoryName: pick<string>(o, ['categoryName', 'CategoryName', 'category', 'Category']),
    sellerId: pick<string>(o, ['sellerId', 'SellerId', 'vendorId', 'VendorId']),
  };
}

function asArrayFromEnvelope(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const inner =
      r['data'] ?? r['Data'] ?? r['items'] ?? r['Items'] ??
      r['results'] ?? r['Results'] ?? r['value'] ?? r['Value'] ??
      r['products'] ?? r['Products'] ?? r['payload'] ?? r['Payload'];
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(r['$values'])) return r['$values'] as unknown[];
  }
  return [];
}

function filterToParams(filter?: ProductFilter): HttpParams {
  let params = new HttpParams();
  if (!filter) return params;
  if (filter.search) params = params.set('Search', filter.search);
  if (filter.categoryId != null) params = params.set('CategoryId', filter.categoryId);
  if (filter.minPrice != null) params = params.set('MinPrice', filter.minPrice);
  if (filter.maxPrice != null) params = params.set('MaxPrice', filter.maxPrice);
  if (filter.sort) params = params.set('Sort', filter.sort);
  return params;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Products`;

  /** Spec API */
  getAll(filter?: ProductFilter): Observable<Product[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/Get_All_Products`, { params: filterToParams(filter) })
      .pipe(map((raw) => asArrayFromEnvelope(raw).map(normalizeProduct) as unknown as Product[]));
  }

  /** Spec API */
  getById(id: number): Observable<Product> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${id}`)
      .pipe(map((raw) => normalizeProduct(raw) as unknown as Product));
  }

  /** Spec API — uses FormData; never set Content-Type. */
  create(data: FormData): Observable<any> {
    return this.http.post<unknown>(`${this.baseUrl}/Add_New_Product`, data);
  }

  /** Spec API — uses FormData; never set Content-Type. */
  update(id: number, data: FormData): Observable<any> {
    return this.http.put<unknown>(`${this.baseUrl}/${id}`, data);
  }

  /** Spec API */
  delete(id: number): Observable<any> {
    return this.http.delete<unknown>(`${this.baseUrl}/${id}`);
  }

  // --- Legacy/compatibility helpers used by existing components ---

  getProducts(query?: ProductQueryParams): Observable<IProduct[]> {
    let params = new HttpParams();
    if (query?.Search) params = params.set('Search', query.Search);
    if (query?.CategoryId != null) params = params.set('CategoryId', query.CategoryId);
    if (query?.MinPrice != null) params = params.set('MinPrice', query.MinPrice);
    if (query?.MaxPrice != null) params = params.set('MaxPrice', query.MaxPrice);
    if (query?.Sort) params = params.set('Sort', query.Sort);
    return this.http
      .get<unknown>(`${this.baseUrl}/Get_All_Products`, { params })
      .pipe(map((raw) => asArrayFromEnvelope(raw).map(normalizeProduct)));
  }

  getProductById(id: number): Observable<IProduct> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(map(normalizeProduct));
  }

  createProduct(formData: FormData): Observable<IProduct> {
    return this.http.post<unknown>(`${this.baseUrl}/Add_New_Product`, formData).pipe(
      map((raw) => {
        const o = asRecord(raw);
        const embedded = o['product'] ?? o['Product'];
        return normalizeProduct(embedded != null ? embedded : raw);
      })
    );
  }

  updateProduct(id: number, formData: FormData): Observable<IProduct> {
    return this.http
      .put<unknown>(`${this.baseUrl}/${id}`, formData)
      .pipe(mergeMap(() => this.getProductById(id)));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  buildFormData(data: IProductFormData, options?: { productId?: number }): FormData {
    const fd = new FormData();
    if (options?.productId != null) fd.append('Id', String(options.productId));
    fd.append('Name', data.Name);
    fd.append('Description', data.Description);
    fd.append('Price', String(data.Price));
    fd.append('StockQuantity', String(data.StockQuantity));
    fd.append('CategoryId', String(data.CategoryId));
    if (data.Image) fd.append('Image', data.Image);
    return fd;
  }
}
