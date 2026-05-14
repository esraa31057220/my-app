import { Routes } from '@angular/router';

export const sellerChildRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./seller-dashboard/seller-dashboard').then((m) => m.SellerDashboard),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./seller-products/seller-products').then((m) => m.SellerProducts),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./seller-orders/seller-orders').then((m) => m.SellerOrders),
  },
  {
    path: 'earnings',
    loadComponent: () =>
      import('./seller-earnings/seller-earnings').then((m) => m.SellerEarnings),
  },
];
