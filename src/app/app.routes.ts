import { Routes } from '@angular/router';
import { DetailViewComponent } from './core/components/detail-view/detail-view';

export const routes: Routes = [
  { path: 'detail/:category/:id', component: DetailViewComponent },
];
