import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { OrderStatus } from '../../models/iorder';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements OnInit {
  private orderService = inject(OrderService);

  rows = signal<Record<string, unknown>[]>([]);
  readonly statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
  ];

  readonly cols = [
    { key: 'id', label: 'Order' },
    { key: 'userName', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total' },
    { key: 'shipLine', label: 'Shipping' },
    { key: 'dateLine', label: 'Date' },
  ];

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe((orders) => {
      const sorted = this.orderService.sortOrdersDesc(orders);
      this.rows.set(
        sorted.map((o) => ({
          ...o,
          total: o.total ?? o.totalPrice ?? 0,
          shipLine: [o.address, o.city, o.phone].filter(Boolean).join(' · ') || o.shippingAddress || '',
          dateLine: String(o.createdAt ?? o.orderDate ?? ''),
        })) as unknown as Record<string, unknown>[]
      );
    });
  }

  changeStatus(row: Record<string, unknown>, status: string): void {
    const id = row['id'] as string | number | undefined;
    if (id === undefined || id === null) return;
    const prev = String(row['status'] ?? '');
    this.orderService.updateOrderStatusWithNotify(id, status, prev).subscribe((updated) => {
      this.rows.update((list) =>
        list.map((r) =>
          r['id'] === id
            ? ({
                ...r,
                status: updated.status,
                shipLine: [updated.address, updated.city, updated.phone]
                  .filter(Boolean)
                  .join(' · ') || updated.shippingAddress || r['shipLine'],
                dateLine: String(updated.createdAt ?? updated.orderDate ?? r['dateLine']),
              } as Record<string, unknown>)
            : r
        )
      );
    });
  }
}
