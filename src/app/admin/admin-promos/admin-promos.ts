import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCmsService } from '../services/admin-cms.service';
import { PromoCode } from '../../models/admin-promo';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-promos.html',
  styleUrl: './admin-promos.css',
})
export class AdminPromos implements OnInit {
  private cms = inject(AdminCmsService);

  list = signal<PromoCode[]>([]);
  draft: PromoCode = {
    id: '',
    code: '',
    discountPercent: 10,
    active: true,
  };

  readonly cols = [
    { key: 'code', label: 'Code' },
    { key: 'discountPercent', label: '%' },
    { key: 'expiresAt', label: 'Expires' },
    { key: 'active', label: 'Active' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.cms.listPromos().subscribe((p) => this.list.set(p));
  }

  rows(): Record<string, unknown>[] {
    return this.list() as unknown as Record<string, unknown>[];
  }

  add(): void {
    const code = this.draft.code.trim().toUpperCase();
    if (!code) return;
    const next: PromoCode = {
      ...this.draft,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      code,
    };
    const merged = [...this.list(), next];
    this.persist(merged);
    this.draft = { id: '', code: '', discountPercent: 10, active: true, expiresAt: undefined };
  }

  toggle(row: Record<string, unknown>): void {
    const id = String(row['id'] ?? '');
    const merged = this.list().map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    this.persist(merged);
  }

  remove(id: unknown): void {
    const sid = String(id ?? '');
    const merged = this.list().filter((p) => p.id !== sid);
    this.persist(merged);
  }

  private persist(merged: PromoCode[]): void {
    this.cms.savePromosRemote(merged).subscribe((saved) => this.list.set(saved));
  }
}
