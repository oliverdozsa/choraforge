import { Routes } from '@angular/router';
import { QuestBoardComponent } from './components/quest-board/quest-board.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: QuestBoardComponent },
  {
    path: 'templates',
    loadComponent: () =>
      import('./components/card-templates/card-templates.component').then((m) => m.CardTemplatesComponent),
  },
  { path: '**', redirectTo: '' },
];
