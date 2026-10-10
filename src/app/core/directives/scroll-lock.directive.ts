import type { OnDestroy } from '@angular/core';
import { Directive, effect, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const MOBILE_QUERY = '(max-width: 767px)';

/**
 * Locks body scrolling while `appScrollLock` is true, but only on mobile viewports where the
 * detail sheet covers the page. Uses a media query so it reacts to viewport changes.
 */
@Directive({
  selector: '[appScrollLock]',
})
export class ScrollLockDirective implements OnDestroy {
  readonly appScrollLock = input(false);

  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia(MOBILE_QUERY) ?? null;

  private previousOverflow = '';
  private locked = false;

  constructor() {
    this.media?.addEventListener('change', this.sync);
    effect(() => this.sync());
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener('change', this.sync);
    this.unlock();
  }

  private readonly sync = (): void => {
    if (this.appScrollLock() && (this.media?.matches ?? false)) {
      this.lock();
    } else {
      this.unlock();
    }
  };

  private lock(): void {
    if (this.locked) return;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.locked = true;
  }

  private unlock(): void {
    if (!this.locked) return;
    this.document.body.style.overflow = this.previousOverflow;
    this.locked = false;
  }
}
