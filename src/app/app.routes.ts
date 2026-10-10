import type { Routes } from '@angular/router';
import { categoryGuard } from './core/guards/category.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'characters' },
  {
    path: ':category',
    canActivate: [categoryGuard],
    loadComponent: () => import('./pages/list-page/list-page').then((m) => m.ListPageComponent),
  },
  {
    path: ':category/:id',
    canActivate: [categoryGuard],
    loadComponent: () => import('./pages/list-page/list-page').then((m) => m.ListPageComponent),
  },
  { path: '**', redirectTo: 'characters' },
];
