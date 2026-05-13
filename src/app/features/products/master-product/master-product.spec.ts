import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterProducts } from './master-product';

describe('MasterProducts', () => {
  let component: MasterProducts;
  let fixture: ComponentFixture<MasterProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
