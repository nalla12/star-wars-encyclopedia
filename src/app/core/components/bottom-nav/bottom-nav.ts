import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIES, CATEGORY_LABELS } from '../../types';
import { CategoryIconComponent } from '../category-icon/category-icon';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, CategoryIconComponent],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  protected readonly categories = CATEGORIES;
  protected readonly CATEGORY_LABELS = CATEGORY_LABELS;
}
