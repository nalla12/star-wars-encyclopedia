import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ScrollLockDirective } from './scroll-lock.directive';

@Component({
  imports: [ScrollLockDirective],
  template: `<div [appScrollLock]="locked()"></div>`,
})
class HostComponent {
  readonly locked = signal(false);
}

const DEFAULT_WIDTH = 1024;

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

describe('ScrollLockDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    setViewportWidth(375);

    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    setViewportWidth(DEFAULT_WIDTH);
    document.body.style.overflow = '';
  });

  it('locks the body on a mobile viewport', () => {
    host.locked.set(true);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('leaves the body alone while disabled', () => {
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
  });

  it('restores the previous overflow when disabled', () => {
    document.body.style.overflow = 'auto';

    host.locked.set(true);
    fixture.detectChanges();
    host.locked.set(false);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('auto');
  });

  it('leaves the body unlocked on a desktop viewport', () => {
    setViewportWidth(1280);

    host.locked.set(true);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
  });

  it('unlocks on destroy', () => {
    host.locked.set(true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });
});
