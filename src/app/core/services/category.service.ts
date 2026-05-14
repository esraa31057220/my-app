import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../../models';
import { CategoryDto, ICategory } from '../../models/icategory';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function pick<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

function asArrayFromEnvelope(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const inner =
      r['data'] ?? r['Data'] ?? r['items'] ?? r['Items'] ??
      r['categories'] ?? r['Categories'];
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(r['$values'])) return r['$values'] as unknown[];
  }
  return [];
}

function normalizeCategory(raw: unknown): ICategory {
  const o = asRecord(raw);
  return {
    id: Number(pick(o, ['id', 'Id']) ?? 0),
    name: String(pick(o, ['name', 'Name']) ?? ''),
  };
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Categories`;

  /** Spec API */
  getAll(): Observable<Category[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/Get_All_Categories`)
      .pipe(map((raw) => asArrayFromEnvelope(raw).map(normalizeCategory) as Category[]));
  }

  /** Spec API */
  create(name: string): Observable<any> {
    const dto: CategoryDto = { name };
    return this.http.post(`${this.baseUrl}/Add_New_Category`, dto);
  }

  /** Spec API */
  update(id: number, name: string): Observable<any> {
    const dto: CategoryDto = { name };
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }

  /** Spec API */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // --- Legacy helpers used by existing components ---

  getCategories(): Observable<ICategory[]> {
    return this.getAll() as unknown as Observable<ICategory[]>;
  }

  createCategory(dto: CategoryDto): Observable<void> {
    return this.http.post(`${this.baseUrl}/Add_New_Category`, dto).pipe(map(() => void 0));
  }

  updateCategory(id: number, dto: CategoryDto): Observable<void> {
    return this.http.put(`${this.baseUrl}/${id}`, dto).pipe(map(() => void 0));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
