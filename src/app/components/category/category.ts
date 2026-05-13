import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICategory } from '../../models/icategory';

@Component({
  selector: 'app-category',
  imports: [CommonModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  categories: ICategory[] = [];

  get allCategories(): string[] {
    return this.categories.map(c => c.name);
  }

  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => {
          this.categories = cats ?? [];
        },
        error: () => {
          this.categories = [];
        },
      });
  }
}