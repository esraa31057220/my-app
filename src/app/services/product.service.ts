import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IProduct, IProductFormData } from '../models/iproduct';
import { CategoryDto, ICategory } from '../models/icategory';

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

function normalizeProduct(raw: unknown): IProduct {
  const o = asRecord(raw);

  const imagePath = pick<string>(o, [
    'imagePath', 'ImagePath',
    'image', 'Image',
    'imageUrl', 'ImageUrl',
    'thumbnail', 'Thumbnail',
    'photo', 'Photo',
  ]);

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

function normalizeCategory(raw: unknown): ICategory {
  const o = asRecord(raw);
  return {
    id: Number(pick(o, ['id', 'Id']) ?? 0),
    name: String(pick(o, ['name', 'Name']) ?? ''),
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

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Products`;
  private categoriesUrl = `${environment.apiUrl}/Categories`;

  getProducts(query?: ProductQueryParams): Observable<IProduct[]> {
    let params = new HttpParams();
    if (query?.Search) params = params.set('Search', query.Search);
    if (query?.CategoryId != null) params = params.set('CategoryId', query.CategoryId);
    if (query?.MinPrice != null) params = params.set('MinPrice', query.MinPrice);
    if (query?.MaxPrice != null) params = params.set('MaxPrice', query.MaxPrice);
    if (query?.Sort) params = params.set('Sort', query.Sort);
    return this.http.get<unknown>(`${this.baseUrl}/Get_All_Products`, { params }).pipe(
      map((raw) => asArrayFromEnvelope(raw).map(normalizeProduct))
    );
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

  getCategories(): Observable<ICategory[]> {
    return this.http.get<unknown>(`${this.categoriesUrl}/Get_All_Categories`).pipe(
      map((raw) => asArrayFromEnvelope(raw).map(normalizeCategory))
    );
  }

  createCategory(dto: CategoryDto): Observable<void> {
    return this.http.post(`${this.categoriesUrl}/Add_New_Category`, dto).pipe(map(() => void 0));
  }

  updateCategory(id: number, dto: CategoryDto): Observable<void> {
    return this.http.put(`${this.categoriesUrl}/${id}`, dto).pipe(map(() => void 0));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
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