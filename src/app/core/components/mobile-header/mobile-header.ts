import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Category, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';

@Component({
  selector: 'app-mobile-header',
  templateUrl: './mobile-header.html',
  styleUrl: './mobile-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeaderComponent {
  readonly currentCategory = input<Category>('all');
  readonly onToggleMenu = output<void>();
  readonly onSelectCategory = output<Category>();

  protected readonly isMenuOpen = signal(false);
  protected readonly categories: Category[] = ['people', 'planets', 'films', 'starships', 'vehicles', 'species'];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  protected getCategoryColor(cat: Category): string {
    return CATEGORY_COLORS[cat];
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
    this.onToggleMenu.emit();
  }

  selectCategory(cat: Category): void {
    this.onSelectCategory.emit(cat);
    this.isMenuOpen.set(false);
  }
}
