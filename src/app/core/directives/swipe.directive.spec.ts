import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { SwipeDirective } from './swipe.directive';

@Component({
  imports: [SwipeDirective],
  template: `<button
    appSwipe
    (swipeLeft)="log('left')"
    (swipeRight)="log('right')"
    (click)="log('click')"
  >
    Go
  </button>`,
})
class HostComponent {
  readonly events = signal<string[]>([]);
  log(event: string): void {
    this.events.update((current) => [...current, event]);
  }
}

function touch(type: 'touchstart' | 'touchend', x: number, y: number): Event {
  const touch = { clientX: x, clientY: y };
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    touches?: unknown[];
    changedTouches?: unknown[];
  };
  event.touches = type === 'touchstart' ? [touch] : [];
  event.changedTouches = [touch];
  return event;
}

describe('SwipeDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  const swipe = (dx: number, dy = 0) => {
    button.dispatchEvent(touch('touchstart', 100, 100));
    button.dispatchEvent(touch('touchend', 100 + dx, 100 + dy));
    fixture.detectChanges();
  };

  const click = () => {
    button.click();
    fixture.detectChanges();
  };

  it('emits swipeLeft for a leftward swipe past the threshold', () => {
    swipe(-80);
    expect(host.events()).toEqual(['left']);
  });

  it('emits swipeRight for a rightward swipe past the threshold', () => {
    swipe(80);
    expect(host.events()).toEqual(['right']);
  });

  it('ignores a swipe under the threshold', () => {
    swipe(-30);
    expect(host.events()).toEqual([]);
  });

  it('locks the axis on a mostly vertical gesture', () => {
    swipe(-80, 120);
    expect(host.events()).toEqual([]);
  });

  it('suppresses the click that follows a swipe', () => {
    swipe(-80);
    click();

    expect(host.events()).toEqual(['left']);
  });

  it('allows a plain click', () => {
    click();

    expect(host.events()).toEqual(['click']);
  });

  it('allows a click after a gesture below the threshold', () => {
    swipe(-20);
    click();

    expect(host.events()).toEqual(['click']);
  });

  it('allows a second click after the swipe was suppressed once', () => {
    swipe(-80);
    click();
    click();

    expect(host.events()).toEqual(['left', 'click']);
  });
});
