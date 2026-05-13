import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { ICategory } from '../../models/icategory';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories implements OnInit {
  private categoryService = inject(CategoryService);

  rows = signal<Record<string, unknown>[]>([]);
  newName = signal('');
  editId = signal<number | null>(null);
  editName = signal('');

  readonly cols = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.categoryService.getCategories().subscribe((c: ICategory[]) => {
      this.rows.set(c as unknown as Record<string, unknown>[]);
    });
  }

  startEdit(row: Record<string, unknown>): void {
    this.editId.set(Number(row['id']));
    this.editName.set(String(row['name'] ?? ''));
  }

  cancelEdit(): void {
    this.editId.set(null);
    this.editName.set('');
  }

  saveEdit(): void {
    const id = this.editId();
    if (id == null) return;
    this.categoryService.updateCategory(id, { name: this.editName().trim() }).subscribe(() => {
      this.cancelEdit();
      this.reload();
    });
  }

  add(): void {
    const n = this.newName().trim();
    if (!n) return;
    this.categoryService.createCategory({ name: n }).subscribe(() => {
      this.newName.set('');
      this.reload();
    });
  }

  deleteRow(id: unknown): void {
    const n = Number(id);
    if (Number.isNaN(n)) return;
    this.categoryService.deleteCategory(n).subscribe(() => this.reload());
  }
}
