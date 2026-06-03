import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.html',
  styleUrl: './global-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  readonly searchQuery = signal('');
  readonly onSearchChange = output<string>();

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.onSearchChange.emit(input.value);
  }
}
