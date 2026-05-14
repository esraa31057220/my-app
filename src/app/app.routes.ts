import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/master-product/master-product').then((m) => m.MasterProducts),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart/cart').then((m) => m.Cart),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/userprofile/userprofile').then((m) => m.UserProfile),
    canActivate: [authGuard],
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/orders/checkout/checkout').then((m) => m.Checkout),
    canActivate: [authGuard],
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./features/orders/my-orders/my-orders').then((m) => m.MyOrders),
    canActivate: [authGuard],
  },
  {
    path: 'order/:id/confirmation',
    loadComponent: () =>
      import('./features/orders/order-confirmation/order-confirmation').then(
        (m) => m.OrderConfirmation
      ),
    canActivate: [authGuard],
  },
  {
    path: 'order/:id/tracking',
    loadComponent: () =>
      import('./features/orders/order-tracking/order-tracking').then((m) => m.OrderTracking),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    redirectTo: 'admin/users',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminChildRoutes),
  },
  { path: '**', redirectTo: 'home' },
];
