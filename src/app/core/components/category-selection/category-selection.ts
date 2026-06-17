import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category, CATEGORY_LABELS, CATEGORY_ICONS } from '../../types';

@Component({
  selector: 'app-category-selection',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './category-selection.html',
  styleUrl: './category-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySelectionComponent {
  protected readonly categoryList: Category[] = [
    'characters', 'planets', 'films', 'starships', 'species',
  ];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  protected getCategoryIconPaths(cat: Category): string[] {
    return CATEGORY_ICONS[cat];
  }
}
