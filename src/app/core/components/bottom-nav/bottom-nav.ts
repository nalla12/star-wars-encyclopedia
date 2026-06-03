import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category, CATEGORY_LABELS } from '../../types';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  readonly currentCategory = input<Category>('people');
  readonly onSelectCategory = output<Category>();

  protected readonly categories: Category[] = ['people', 'planets', 'films', 'starships', 'vehicles', 'species'];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }
}
