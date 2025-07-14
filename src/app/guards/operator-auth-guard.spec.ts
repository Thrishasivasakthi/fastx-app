import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { operatorAuthGuard } from './operator-auth-guard';

describe('operatorAuthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => operatorAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
