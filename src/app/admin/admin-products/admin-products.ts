import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../models/iproduct';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private search$ = new Subject<string>();

  apiSearch = signal('');
  rows = signal<Record<string, unknown>[]>([]);
  loading = signal(false);

  readonly cols = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'stockQuantity', label: 'Stock' },
    { key: 'categoryName', label: 'Category' },
  ];

  private sub = this.search$
    .pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        this.loading.set(true);
        return this.productService
          .getProducts({ Search: q.trim() || undefined })
          .pipe(catchError(() => of([] as IProduct[])));
      })
    )
    .subscribe((list) => {
      this.rows.set(list as unknown as Record<string, unknown>[]);
      this.loading.set(false);
    });

  ngOnInit(): void {
    this.search$.next('');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSearchInput(v: string): void {
    this.apiSearch.set(v);
    this.search$.next(v);
  }

  deleteProduct(id: unknown): void {
    const n = Number(id);
    if (Number.isNaN(n)) return;
    this.productService.deleteProduct(n).subscribe(() => {
      this.rows.update((r) => r.filter((row) => Number(row['id']) !== n));
    });
  }
}
