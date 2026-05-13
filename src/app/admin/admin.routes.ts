import { Routes } from '@angular/router';

export const adminChildRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
  },
  {
    path: 'users',
    loadComponent: () => import('./admin-users/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./admin-products/admin-products').then((m) => m.AdminProducts),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./admin-categories/admin-categories').then((m) => m.AdminCategories),
  },
  {
    path: 'orders',
    loadComponent: () => import('./admin-orders/admin-orders').then((m) => m.AdminOrders),
  },
  {
    path: 'promos',
    loadComponent: () => import('./admin-promos/admin-promos').then((m) => m.AdminPromos),
  },
  {
    path: 'banners',
    loadComponent: () => import('./admin-banners/admin-banners').then((m) => m.AdminBanners),
  },
];
