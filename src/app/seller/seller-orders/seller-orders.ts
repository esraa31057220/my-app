import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { OrderStatus } from '../../models/iorder';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-orders.html',
  styleUrl: './seller-orders.css',
})
export class SellerOrders implements OnInit {
  private orderService = inject(OrderService);

  rows = signal<any[]>([]);
  loading = signal(false);
  readonly statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrders().subscribe((orders) => {
      const sorted = this.orderService.sortOrdersDesc(orders);
      this.rows.set(
        sorted.map((o) => ({
          ...o,
          total: o.totalPrice ?? 0,
          shipLine: [o.address, o.city, o.phone].filter(Boolean).join(' · ') || o.shippingAddress || '',
          dateLine: String(o.orderDate ?? ''),
        }))
      );
      this.loading.set(false);
    });
  }

  changeStatus(order: any, status: string): void {
    const id = order.id;
    if (id === undefined || id === null) return;
    const prev = String(order.status ?? '');
    this.orderService.updateOrderStatusWithNotify(id, status, prev).subscribe((updated) => {
      this.rows.update((list) =>
        list.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status,
                shipLine: [updated.address, updated.city, updated.phone]
                  .filter(Boolean)
                  .join(' · ') || updated.shippingAddress || r.shipLine,
                dateLine: String(updated.orderDate ?? r.dateLine),
              }
            : r
        )
      );
    });
  }

  getStatusClass(status: string): string {
    const s = String(this.orderService.normalizeStatus(status));
    return `status-${s}`;
  }

  getStatusLabel(status: string): string {
    const s = String(this.orderService.normalizeStatus(status));
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
