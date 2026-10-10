import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIES, CATEGORY_LABELS } from '../../types';
import { CategoryIconComponent } from '../category-icon/category-icon';

@Component({
  selector: 'app-category-selection',
  imports: [RouterLink, RouterLinkActive, CategoryIconComponent],
  templateUrl: './category-selection.html',
  styleUrl: './category-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySelectionComponent {
  protected readonly categories = CATEGORIES;
  protected readonly CATEGORY_LABELS = CATEGORY_LABELS;
}
