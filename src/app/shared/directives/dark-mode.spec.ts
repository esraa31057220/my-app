import { DarkModeDirective } from './dark-mode';

describe('DarkMode', () => {
  it('should create an instance', () => {
    const directive = new DarkModeDirective(
      { nativeElement: document.createElement('button') },
      { addClass: () => {}, removeClass: () => {} } as any
    );
    expect(directive).toBeTruthy();
  });
});
