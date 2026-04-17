import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminComponent } from './admin/admin.component';
import { AdminWithdrawalsComponent } from './admin-withdrawals/admin-withdrawals.component';
import { ExamAttemptComponent } from './exam-attempt/exam-attempt.component';
import { ExamHistoryComponent } from './exam-history/exam-history.component';
import { ExamsComponent } from './exams/exams.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RankingComponent } from './ranking/ranking.component';
import { RxWalletComponent } from './rx-wallet/rx-wallet.component';
import { SharedModule } from './shared/shared.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './shared/interceptors/jwt.interceptor';
import { SidenvbarComponent } from './sidenvbar/sidenvbar.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    AdminWithdrawalsComponent,
    ExamsComponent,
    ExamAttemptComponent,
    ExamHistoryComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    ProfileComponent,
    RankingComponent,
    RxWalletComponent,
    SidenvbarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    CommonModule

  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
