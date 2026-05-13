import { LightBox } from './light-box';

describe('LightBox', () => {
  it('should create an instance', () => {
    const mockElementRef = { nativeElement: { style: {} } };
    const directive = new LightBox(mockElementRef as any);
    expect(directive).toBeTruthy();
  });
});
