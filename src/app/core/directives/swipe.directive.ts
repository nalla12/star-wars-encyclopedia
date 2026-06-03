import { Directive, output } from '@angular/core';

@Directive({
  selector: '[swipe]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
})
export class SwipeDirective {
  readonly onSwipeLeft = output<void>();
  readonly onSwipeRight = output<void>();

  private startX = 0;
  private startY = 0;

  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.startX;
    const dy = event.changedTouches[0].clientY - this.startY;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 0) {
        this.onSwipeRight.emit();
      } else {
        this.onSwipeLeft.emit();
      }
    }
  }
}
