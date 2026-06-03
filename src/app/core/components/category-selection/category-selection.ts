import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Category, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.html',
  styleUrl: './category-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySelectionComponent {
  readonly currentCategory = input<Category>('all');
  readonly onSelectCategory = output<Category>();

  protected readonly categoryList: Category[] = [
    'all', 'people', 'planets', 'films', 'starships', 'vehicles', 'species',
  ];

  protected readonly catThemeColor = computed(() => {
    const cat = this.currentCategory();
    return CATEGORY_COLORS[cat] ?? '#6E7075';
  });

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  selectCategory(cat: Category): void {
    this.onSelectCategory.emit(cat);
  }
}
