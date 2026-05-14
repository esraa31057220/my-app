import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../core/services/category.service';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICategory } from '../../../models/icategory';

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

  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.categoryService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats: ICategory[]) => {
          this.categories = cats ?? [];
        },
        error: () => {
          this.categories = [];
        },
      });
  }
}