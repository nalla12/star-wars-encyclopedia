import type { OnDestroy } from '@angular/core';
import { Directive, inject, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const SWIPE_THRESHOLD_PX = 50;
const AXIS_LOCK_RATIO = 2;

@Directive({
  selector: '[appSwipe]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
})
export class SwipeDirective implements OnDestroy {
  readonly swipeLeft = output<void>();
  readonly swipeRight = output<void>();

  private readonly document = inject(DOCUMENT);

  private startX = 0;
  private startY = 0;
  private armed = false;

  ngOnDestroy(): void {
    this.disarm();
  }

  onTouchStart(event: TouchEvent): void {
    this.disarm();
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.startX;
    const dy = event.changedTouches[0].clientY - this.startY;

    if (Math.abs(dx) <= SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy) * AXIS_LOCK_RATIO) {
      return;
    }

    this.arm();

    if (dx > 0) {
      this.swipeRight.emit();
    } else {
      this.swipeLeft.emit();
    }
  }

  /**
   * Browsers still synthesise a click after a touch gesture. Swallowing it in the capture phase on
   * the document beats the element's own click handler, which would otherwise navigate twice.
   */
  private arm(): void {
    if (this.armed) return;
    this.armed = true;
    this.document.addEventListener('click', this.swallowClick, { capture: true, once: true });
  }

  private disarm(): void {
    this.armed = false;
    this.document.removeEventListener('click', this.swallowClick, true);
  }

  private readonly swallowClick = (event: Event): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
}
