import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleTaxComponent } from './vehicle-tax.component';

describe('VehicleTaxComponent', () => {
  let component: VehicleTaxComponent;
  let fixture: ComponentFixture<VehicleTaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleTaxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleTaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
