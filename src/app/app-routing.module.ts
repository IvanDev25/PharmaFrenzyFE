import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AdminWithdrawalsComponent } from './admin-withdrawals/admin-withdrawals.component';
import { ExamAttemptComponent } from './exam-attempt/exam-attempt.component';
import { ExamHistoryComponent } from './exam-history/exam-history.component';
import { ExamsComponent } from './exams/exams.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RankingComponent } from './ranking/ranking.component';
import { RxWalletComponent } from './rx-wallet/rx-wallet.component';
import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';
import { AuthorizationGuard } from './shared/guards/authorization.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'Admin', component: AdminComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'Admin/withdrawals', component: AdminWithdrawalsComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'Admin/modules', component: AdminComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'Admin/subjects', component: AdminComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'Admin/questions', component: AdminComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'Admin/performance', component: AdminComponent, canActivate: [AuthorizationGuard], data: { roles: ['Admin'] } },
  { path: 'exams', component: ExamsComponent, canActivate: [AuthorizationGuard], data: { roles: ['Student'] } },
  { path: 'exams/history', component: ExamHistoryComponent, canActivate: [AuthorizationGuard], data: { roles: ['Student'] } },
  { path: 'exams/attempt/:attemptId', component: ExamAttemptComponent, canActivate: [AuthorizationGuard], data: { roles: ['Student'] } },
  { path: 'rankings', component: RankingComponent, canActivate: [AuthorizationGuard], data: { roles: ['Student'] } },
  { path: 'wallet', component: RxWalletComponent, canActivate: [AuthorizationGuard], data: { roles: ['Student'] } },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthorizationGuard] },
  { path: 'account', loadChildren: () => import('./account/account.module').then(m => m.AccountModule) },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
