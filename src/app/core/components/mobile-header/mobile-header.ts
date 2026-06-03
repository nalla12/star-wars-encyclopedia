import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category, CATEGORY_LABELS } from '../../types';

@Component({
  selector: 'app-mobile-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './mobile-header.html',
  styleUrl: './mobile-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeaderComponent {
  protected readonly isMenuOpen = signal(false);
  protected readonly categories: Category[] = ['people', 'planets', 'films', 'starships', 'vehicles', 'species'];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
