import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category, CATEGORY_LABELS } from '../../types';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  protected readonly categories: Category[] = ['people', 'planets', 'films', 'starships', 'vehicles', 'species'];

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }
}
