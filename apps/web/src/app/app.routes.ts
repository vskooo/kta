import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/date-wheel/pages/date-wheel-page/date-wheel-page'
      ).then((m) => m.DateWheelPage),
  },
  { path: '**', redirectTo: '' },
];
