import { Routes } from '@angular/router';
import { MaterialFormComponent } from './material-form/material-form.component';
import { MaterialListComponent } from './material-list/material-list.component';

export const routes: Routes = [
  { path: '', component: MaterialFormComponent },
  { path: 'material-list', component: MaterialListComponent },
];
