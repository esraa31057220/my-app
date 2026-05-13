import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCmsService } from '../services/admin-cms.service';
import { SiteBanner } from '../../models/admin-banner';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-banners.html',
  styleUrl: './admin-banners.css',
})
export class AdminBanners implements OnInit {
  private cms = inject(AdminCmsService);

  list = signal<SiteBanner[]>([]);
  draft: SiteBanner = {
    id: '',
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    active: true,
  };

  readonly cols = [
    { key: 'sortOrder', label: '#' },
    { key: 'title', label: 'Title' },
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'linkUrl', label: 'Link' },
    { key: 'active', label: 'Active' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.cms.listBanners().subscribe((b) => this.list.set([...b].sort((a, z) => a.sortOrder - z.sortOrder)));
  }

  rows(): Record<string, unknown>[] {
    return this.list() as unknown as Record<string, unknown>[];
  }

  add(): void {
    const title = this.draft.title.trim();
    const imageUrl = this.draft.imageUrl.trim();
    if (!title || !imageUrl) return;
    const next: SiteBanner = {
      ...this.draft,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      imageUrl,
      linkUrl: this.draft.linkUrl?.trim() || undefined,
      sortOrder: Number(this.draft.sortOrder) || 0,
    };
    const merged = [...this.list(), next];
    this.persist(merged);
    this.draft = { id: '', title: '', imageUrl: '', linkUrl: '', sortOrder: 0, active: true };
  }

  toggle(row: Record<string, unknown>): void {
    const id = String(row['id'] ?? '');
    const merged = this.list().map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    this.persist(merged);
  }

  remove(id: unknown): void {
    const sid = String(id ?? '');
    this.persist(this.list().filter((b) => b.id !== sid));
  }

  private persist(merged: SiteBanner[]): void {
    this.cms.saveBannersRemote(merged).subscribe((saved) => this.list.set(saved));
  }
}
