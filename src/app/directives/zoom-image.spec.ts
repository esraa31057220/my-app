import { ZoomImageDirective } from './zoom-image';

describe('ZoomImage', () => {
  it('should create an instance', () => {
    const directive = new ZoomImageDirective(
      { nativeElement: document.createElement('img') },
      { setStyle: () => {}, addClass: () => {}, removeClass: () => {} } as any
    );
    expect(directive).toBeTruthy();
  });
});
