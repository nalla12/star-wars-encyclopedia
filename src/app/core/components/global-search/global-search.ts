import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.html',
  styleUrl: './global-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  readonly resetKey = input(0);
  readonly searchQuery = signal('');
  readonly onSearchChange = output<string>();

  constructor() {
    effect(() => {
      this.resetKey();
      this.searchQuery.set('');
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.onSearchChange.emit(input.value);
  }

  clearSearch(input: HTMLInputElement): void {
    this.searchQuery.set('');
    this.onSearchChange.emit('');
    input.focus();
  }
}
