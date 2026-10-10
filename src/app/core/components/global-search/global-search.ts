import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.html',
  styleUrl: './global-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  readonly query = model('');

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(input: HTMLInputElement): void {
    this.query.set('');
    input.focus();
  }
}
