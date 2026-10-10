import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { isCategory } from '../types';

export const categoryGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const category: unknown = route.paramMap.get('category');

  if (isCategory(category)) {
    return true;
  }

  return router.createUrlTree(['/characters']);
};
