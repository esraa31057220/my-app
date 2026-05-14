import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedButton } from './shared-button';

describe('SharedButton', () => {
  let component: SharedButton;
  let fixture: ComponentFixture<SharedButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedButton],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
