import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { AdminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: 'products',
    loadComponent: () => import('./components/master-product/master-product').then(m => m.MasterProducts)
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/category/category').then(m => m.Category)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then(m => m.Cart),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/userprofile/userprofile').then(m => m.UserProfile),
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-orders',
    loadComponent: () => import('./components/my-orders/my-orders').then(m => m.MyOrders),
    canActivate: [AuthGuard]
  },
  {
    path: 'order/:id/confirmation',
    loadComponent: () => import('./components/order-confirmation/order-confirmation').then(m => m.OrderConfirmation),
    canActivate: [AuthGuard]
  },
  {
    path: 'order/:id/tracking',
    loadComponent: () => import('./components/order-tracking/order-tracking').then(m => m.OrderTracking),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    redirectTo: 'admin/users',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminChildRoutes)
  },
  { path: '**', redirectTo: 'home' }
];