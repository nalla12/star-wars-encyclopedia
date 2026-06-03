import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MobileHeaderComponent } from './core/components/mobile-header/mobile-header';
import { BottomNavComponent } from './core/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MobileHeaderComponent,
    BottomNavComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
