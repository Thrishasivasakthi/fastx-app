import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SearchComponent } from './user/search/search';
import { BookingsComponent } from './user/bookings/bookings';
import { ProfileComponent } from './user/profile/profile';
import { OperatorDashboardComponent } from './operator/dashboard/operator-dashboard';
import { ManageBusComponent } from './operator/manage-bus/manage-bus';
import { OperatorBookingsComponent } from './operator/bookings/bookings';
import { OperatorBusAmenitiesComponent } from './operator/amenities/amenities';
import { OperatorAuthGuard } from './guards/operator-auth-guard';
import { UserAuthGuard } from './guards/user-auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  // User-protected routes
  {
    path: 'user/search',
    component: SearchComponent,
    canActivate: [UserAuthGuard]
  },
  {
    path: 'user/seats/:busId',
    loadComponent: () =>
      import('./user/seat-selection/seat-selection').then(m => m.SeatSelectionComponent),
    canActivate: [UserAuthGuard]
  },
  {
    path: 'user/bookings',
    component: BookingsComponent,
    canActivate: [UserAuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [UserAuthGuard]
  },

  // Operator-protected routes
  {
    path: 'operator/dashboard',
    component: OperatorDashboardComponent,
    canActivate: [OperatorAuthGuard]
  },
  {
    path: 'operator/manage-bus',
    component: ManageBusComponent,
    canActivate: [OperatorAuthGuard]
  },
  {
    path: 'operator/bookings',
    component: OperatorBookingsComponent,
    canActivate: [OperatorAuthGuard]
  },
  {
    path: 'operator/amenities',
    component: OperatorBusAmenitiesComponent,
    canActivate: [OperatorAuthGuard]
  },
  {
  path: 'register',
  loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent)
}


];
