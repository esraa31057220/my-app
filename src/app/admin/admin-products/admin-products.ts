import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ICategory } from '../../models/icategory';
import { IProduct, IProductFormData } from '../../models/iproduct';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

interface ProductDraft {
  Name: string;
  Description: string;
  Price: number;
  StockQuantity: number;
  CategoryId: number;
  Image: File | null;
}

const EMPTY_DRAFT: ProductDraft = {
  Name: '',
  Description: '',
  Price: 0,
  StockQuantity: 0,
  CategoryId: 0,
  Image: null,
};

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private search$ = new Subject<string>();

  apiSearch = signal('');
  rows = signal<Record<string, unknown>[]>([]);
  categories = signal<ICategory[]>([]);
  loading = signal(false);
  saving = signal(false);
  saveError = signal('');

  draft = signal<ProductDraft>({ ...EMPTY_DRAFT });
  editId = signal<number | null>(null);
  formOpen = signal(false);

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
    this.categoryService
      .getCategories()
      .pipe(catchError(() => of([] as ICategory[])))
      .subscribe((c) => this.categories.set(c));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSearchInput(v: string): void {
    this.apiSearch.set(v);
    this.search$.next(v);
  }

  openNew(): void {
    this.editId.set(null);
    this.draft.set({ ...EMPTY_DRAFT });
    this.saveError.set('');
    this.formOpen.set(true);
  }

  openEdit(row: Record<string, unknown>): void {
    const id = Number(row['id']);
    if (Number.isNaN(id)) return;
    this.editId.set(id);
    this.draft.set({
      Name: String(row['name'] ?? ''),
      Description: String(row['description'] ?? ''),
      Price: Number(row['price'] ?? 0),
      StockQuantity: Number(row['stockQuantity'] ?? 0),
      CategoryId: Number(row['categoryId'] ?? 0),
      Image: null,
    });
    this.saveError.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editId.set(null);
    this.draft.set({ ...EMPTY_DRAFT });
    this.saveError.set('');
  }

  updateField<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.draft.update((d) => ({ ...d, Image: file }));
  }

  save(): void {
    const d = this.draft();
    if (!d.Name.trim()) {
      this.saveError.set('Name is required.');
      return;
    }
    if (!d.CategoryId) {
      this.saveError.set('Please choose a category.');
      return;
    }
    if (d.Price <= 0) {
      this.saveError.set('Price must be greater than zero.');
      return;
    }

    const payload: IProductFormData = {
      Name: d.Name.trim(),
      Description: d.Description.trim(),
      Price: Number(d.Price),
      StockQuantity: Number(d.StockQuantity),
      CategoryId: Number(d.CategoryId),
    };
    if (d.Image) payload.Image = d.Image;

    const id = this.editId();
    const fd = this.productService.buildFormData(payload, id != null ? { productId: id } : undefined);

    this.saving.set(true);
    this.saveError.set('');

    const req$ = id != null
      ? this.productService.updateProduct(id, fd)
      : this.productService.createProduct(fd);

    req$
      .pipe(
        catchError(() => {
          this.saveError.set('Could not save the product. Please try again.');
          return of(null);
        })
      )
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.closeForm();
        this.search$.next(this.apiSearch());
      });
  }

  deleteProduct(id: unknown): void {
    const n = Number(id);
    if (Number.isNaN(n)) return;
    this.productService.deleteProduct(n).subscribe(() => {
      this.rows.update((r) => r.filter((row) => Number(row['id']) !== n));
    });
  }
}
