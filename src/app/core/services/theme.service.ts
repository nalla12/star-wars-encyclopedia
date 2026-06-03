import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal<ThemeMode>('light');

  toggleMode(): void {
    this.isDarkMode.update(mode => (mode === 'light' ? 'dark' : 'light'));
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkMode());
  }
}
