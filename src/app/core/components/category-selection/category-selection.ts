import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category, CATEGORY_LABELS } from '../../types';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.html',
  styleUrl: './category-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySelectionComponent {
  readonly currentCategory = input<Category>('people');
  readonly onSelectCategory = output<Category>();

  protected readonly categoryList: Category[] = [
    'people', 'planets', 'films', 'starships', 'vehicles', 'species',
  ];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  selectCategory(cat: Category): void {
    this.onSelectCategory.emit(cat);
  }
}
