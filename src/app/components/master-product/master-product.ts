import {
  Component,
  ViewChild,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { Products } from '../products/products';
import { FormsModule } from '@angular/forms';
import { ICategory } from '../../models/icategory';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../models/iproduct';
import { AuthService } from '../../services/AuthServices/auth-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';

@Component({
  selector: 'app-master-products',
  imports: [Products, FormsModule, CommonModule],
  templateUrl: './master-product.html',
  styleUrl: './master-product.css',
})
export class MasterProducts implements OnInit {
  selectedCategory: string = 'All';
  selectedCategoryId: number | null = null;
  maxPrice: number = 1000;
  searchQuery: string = '';
  totalparentPrice: number = 0;
  catList: ICategory[] = [];
  categoriesLoading = false;
  categoriesError = '';

  isEditMode: boolean = false;
  currentProduct: IProduct = this.getEmptyProduct();

  catOpen: boolean = false;
  priceOpen: boolean = false;

  saving = false;
  saveError = '';

  selectedImageFile: File | null = null;

  @ViewChild(Products) productsChild!: Products;

  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.categoriesLoading = true;
    this.categoriesError = '';
    this.productService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.categoriesError = 'Could not load categories.';
          this.catList = [];
          return EMPTY;
        }),
        finalize(() => {
          this.categoriesLoading = false;
        })
      )
      .subscribe({
        next: (cats) => {
          this.catList = cats ?? [];
        },
      });
  }

  clearAll(): void {
    this.selectedCategory = 'All';
    this.selectedCategoryId = null;
    this.maxPrice = 1000;
    this.searchQuery = '';
    this.catOpen = false;
    this.priceOpen = false;
  }

  get hasActiveFilters(): boolean {
    return this.selectedCategory !== 'All' || this.maxPrice < 1000;
  }

  RecievedTotalPrice(price: number): void {
    this.totalparentPrice = price;
  }

  getEmptyProduct(): IProduct {
    return {
      id: 0,
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      categoryId: 0,
      categoryName: '',
      image: '',
    };
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedImageFile = input.files[0];
    }
  }

  addProduct(): void {
    this.isEditMode = false;
    this.currentProduct = this.getEmptyProduct();
    this.selectedImageFile = null;
    this.saveError = '';
  }

  editProduct(product: IProduct): void {
    this.isEditMode = true;
    this.currentProduct = { ...product };
    this.selectedImageFile = null;
    this.saveError = '';
  }

  saveProduct(): void {
    if (this.saving) return;

    this.saving = true;
    this.saveError = '';

    const formData = this.productService.buildFormData(
      {
        Name: this.currentProduct.name,
        Description: this.currentProduct.description,
        Price: this.currentProduct.price,
        StockQuantity: this.currentProduct.stockQuantity,
        CategoryId: this.currentProduct.categoryId,
        Image: this.selectedImageFile ?? undefined,
      },
      this.isEditMode ? { productId: this.currentProduct.id } : undefined
    );

    const request$ = this.isEditMode
      ? this.productService.updateProduct(this.currentProduct.id, formData)
      : this.productService.createProduct(formData);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.saveError = 'Failed to save product. Please try again.';
          return EMPTY;
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.productsChild?.loadProducts();
        },
      });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService
      .deleteProduct(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          alert('Failed to delete product. Please try again.');
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.productsChild?.loadProducts();
        },
      });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  selectCategoryAll(): void {
    this.selectedCategory = 'All';
    this.selectedCategoryId = null;
    this.catOpen = false;
  }

  selectCategory(cat: ICategory): void {
    this.selectedCategory = cat.name;
    this.selectedCategoryId = cat.id;
    this.catOpen = false;
  }

  private resetForm(): void {
    this.currentProduct = this.getEmptyProduct();
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.saveError = '';
  }
}