import {
  Component,
  TemplateRef,
  contentChild,
  input,
  computed,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { applyClientPaging, applyClientSearch } from '../../../models/admin-common';

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-data-table.html',
  styleUrl: './admin-data-table.css',
})
export class AdminDataTableComponent {
  readonly columns = input.required<{ key: string; label: string }[]>();
  readonly rowSource = input.required<Record<string, unknown>[]>();
  readonly searchKeys = input<string[]>([]);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);

  readonly actionsTpl = contentChild<TemplateRef<{ $implicit: Record<string, unknown> }>>(
    'actions'
  );

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  constructor() {
    effect(() => {
      this.searchTerm();
      untracked(() => this.pageIndex.set(0));
    });
    effect(() => {
      this.rowSource();
      untracked(() => this.pageIndex.set(0));
    });
  }

  readonly filtered = computed(() => {
    const keys =
      this.searchKeys().length > 0
        ? this.searchKeys()
        : this.columns().map((c) => c.key);
    return applyClientSearch(this.rowSource(), this.searchTerm(), keys);
  });

  readonly total = computed(() => this.filtered().length);

  readonly pagedRows = computed(() =>
    applyClientPaging(this.filtered(), this.pageIndex(), this.pageSize())
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize())))
  );

  cell(row: Record<string, unknown>, key: string): string {
    const v = row[key];
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  trackRow(_i: number, row: Record<string, unknown>): string {
    const id = row['id'] ?? row['Id'] ?? row['orderId'];
    return id != null ? String(id) : JSON.stringify(row);
  }

  prev(): void {
    this.pageIndex.update((p) => Math.max(0, p - 1));
  }

  next(): void {
    this.pageIndex.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  setPageSize(n: number): void {
    this.pageSize.set(n);
    this.pageIndex.set(0);
  }
}
