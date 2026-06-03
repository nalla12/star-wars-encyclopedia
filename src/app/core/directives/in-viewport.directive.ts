import { Directive, inject, ElementRef, DestroyRef, output } from '@angular/core';

@Directive({
  selector: '[appInViewport]',
})
export class InViewportDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly onIntersect = output<void>();

  constructor() {
    const el = this.elementRef.nativeElement;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          this.onIntersect.emit();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
