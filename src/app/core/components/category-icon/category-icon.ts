import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Category } from '../../types';
import { CATEGORY_ICONS } from '../../icons/category-icons';

@Component({
  selector: 'app-category-icon',
  templateUrl: './category-icon.html',
  styleUrl: './category-icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryIconComponent {
  readonly category = input.required<Category>();
  readonly size = input(24);

  protected readonly paths = computed(() => CATEGORY_ICONS[this.category()]);
}
