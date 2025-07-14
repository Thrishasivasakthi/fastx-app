import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBus } from './manage-bus';

describe('ManageBus', () => {
  let component: ManageBus;
  let fixture: ComponentFixture<ManageBus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageBus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageBus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
