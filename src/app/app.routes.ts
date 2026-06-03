import { Routes } from '@angular/router';
import { DetailViewComponent } from './core/components/detail-view/detail-view';
import { ListPageComponent } from './pages/list-page/list-page';

export const routes: Routes = [
  { path: '', redirectTo: 'people', pathMatch: 'full' },
  {
    path: ':category',
    component: ListPageComponent,
    children: [
      { path: ':id', component: DetailViewComponent },
    ],
  },
];
