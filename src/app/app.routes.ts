import { Routes } from '@angular/router';
import { ListPageComponent } from './pages/list-page/list-page';

export const routes: Routes = [
  { path: '', redirectTo: 'characters', pathMatch: 'full' },
  {
    path: ':category',
    component: ListPageComponent,
  },
];
