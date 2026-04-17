import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, of, ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfirmEmail } from '../shared/models/account/confirmEmail';
import { Login } from '../shared/models/account/login';
import { Register } from '../shared/models/account/register';
import { ResetPassword } from '../shared/models/account/resetPassword';
import { RxWallet } from '../shared/models/account/rx-wallet';
import { UpdateProfile } from '../shared/models/account/update-profile';
import { User } from '../shared/models/account/user';
import { WithdrawalRequest } from '../shared/models/account/withdrawal-request';

export interface PendingRegistration {
  email: string;
  verificationToken: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  university?: string;
  gender?: string;
  password?: string;
}

interface RegistrationOtpPayload {
  email: string;
}

interface VerifyRegistrationOtpPayload {
  email: string;
  otp: string;
}

interface VerifyRegistrationOtpResponse {
  title: string;
  message: string;
  verificationToken: string;
}

export interface DailyStreakStatus {
  currentStreak: number;
  canRedeemToday: boolean;
  rewardPoints: number;
  totalPoints: number;
  currentLocalDate: string;
  lastClaimLocalDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly pendingRegisterKey = 'identityAppPendingRegister';

  private userSource = new ReplaySubject<User | null>(1);
  user$ = this.userSource.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  refreshUser(jwt: string | null) {
    if (jwt === null) {
      this.userSource.next(null)
      return of(undefined);
    }

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', 'bearer ' + jwt);

    return this.http.get<User>(`${environment.appUrl}/api/account/refresh-user-token`, {headers}).pipe(
      map((user: User) => {
        if (user) {
          this.setUser(user);
        }
      })
    )
  }

  login(model: Login) {
    return this.http.post<User>(`${environment.appUrl}/api/account/login`, model).pipe(
      map((user: User) => {
        if (user) {
          this.setUser(user);
          return user;
        }
        return null;
      })
    );
  }

  logout() {
    localStorage.removeItem(environment.userKey);
    this.userSource.next(null);
    this.router.navigateByUrl('/account/login');

  }
  register(model: Register) {
    return this.http.post<User>(`${environment.appUrl}/api/account/register`, model).pipe(
      map((user: User) => {
        if (user) {
          this.setUser(user);
          return user;
        }

        return null;
      })
    );
  }

  sendRegistrationOtp(model: RegistrationOtpPayload) {
    return this.http.post(`${environment.appUrl}/api/account/send-registration-otp`, model);
  }

  verifyRegistrationOtp(model: VerifyRegistrationOtpPayload) {
    return this.http.post<VerifyRegistrationOtpResponse>(`${environment.appUrl}/api/account/verify-registration-otp`, model);
  }

  setPendingRegistration(model: PendingRegistration) {
    sessionStorage.setItem(this.pendingRegisterKey, JSON.stringify(model));
  }

  getPendingRegistration(): PendingRegistration | null {
    const rawValue = sessionStorage.getItem(this.pendingRegisterKey);
    return rawValue ? JSON.parse(rawValue) as PendingRegistration : null;
  }

  clearPendingRegistration() {
    sessionStorage.removeItem(this.pendingRegisterKey);
  }

  confirmEmail(model: ConfirmEmail) {
    return this.http.put(`${environment.appUrl}/api/account/confirm-email`, model);
  }

  resendEmailConfirmationLink(email: ConfirmEmail) {
    return this.http.post(`${environment.appUrl}/api/account/resend-email-confirmation-link/${email}`, {});
  }

  forgotUsernameOrPassword(email: string){
    return this.http.post(`${environment.appUrl}/api/account/forgot-username-or-password/${email}`, {});
  }

  resetPassword(model: ResetPassword) {
    return this.http.put(`${environment.appUrl}/api/account/reset-password`, model);
  }

  getUsersByRole(role: 'Student' | 'Admin') {
    return this.http.get<User[]>(`${environment.appUrl}/api/account/get-users-by-role/${role}`);
  }

  enableDailyStreakForTesting(studentId: string) {
    return this.http.post(`${environment.appUrl}/api/account/daily-streak/test-enable/${studentId}`, {});
  }

  updateProfile(model: UpdateProfile) {
    return this.http.put<User>(`${environment.appUrl}/api/account/update-profile`, model).pipe(
      map((user: User) => {
        if (user) {
          this.setUser(user);
          return user;
        }

        return null;
      })
    );
  }

  getDailyStreakStatus() {
    return this.http.get<DailyStreakStatus>(`${environment.appUrl}/api/account/daily-streak`);
  }

  redeemDailyStreak() {
    return this.http.post<DailyStreakStatus>(`${environment.appUrl}/api/account/daily-streak/redeem`, {}).pipe(
      map((status: DailyStreakStatus) => {
        this.updateCurrentUser({
          totalPoints: status.totalPoints,
          currentStreak: status.currentStreak,
          canRedeemDailyStreakToday: status.canRedeemToday,
          dailyStreakRewardPoints: status.rewardPoints
        });

        return status;
      })
    );
  }

  getMyRxWallet() {
    return this.http.get<any>(`${environment.appUrl}/api/rxwallet/my`).pipe(
      map(wallet => this.normalizeWallet(wallet))
    );
  }

  createWithdrawalRequest(model: { rxCoinAmount: number; gcashNumber: string; gcashName: string; }) {
    return this.http.post<any>(`${environment.appUrl}/api/rxwallet/withdrawals`, model).pipe(
      map((wallet) => {
        const normalizedWallet = this.normalizeWallet(wallet);
        this.updateCurrentUser({
          rxCoinBalance: normalizedWallet.availableRxCoinBalance,
          rxCoinOnHold: normalizedWallet.pendingRxCoinBalance
        });

        return normalizedWallet;
      })
    );
  }

  getWithdrawalRequests(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<any[]>(`${environment.appUrl}/api/rxwallet/admin/withdrawals${query}`).pipe(
      map(requests => requests.map(request => this.normalizeWithdrawalRequest(request)))
    );
  }

  updateWithdrawalRequestStatus(id: number, model: { status: string; adminNotes?: string | null; }) {
    return this.http.put<any>(`${environment.appUrl}/api/rxwallet/admin/withdrawals/${id}/status`, model).pipe(
      map(request => this.normalizeWithdrawalRequest(request))
    );
  }

  getJWT() {
    const key = localStorage.getItem(environment.userKey);
    if (key) {
      const user: User = JSON.parse(key);
      return user.jwt;
    } else {
      return null;
    }
  }
  private setUser(user: User) {
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.userSource.next(user);
  }

  private updateCurrentUser(changes: Partial<User>) {
    const rawUser = localStorage.getItem(environment.userKey);
    if (!rawUser) {
      return;
    }

    const currentUser = JSON.parse(rawUser) as User;
    const updatedUser: User = {
      ...currentUser,
      ...changes
    };

    this.setUser(updatedUser);
  }

  private normalizeWallet(wallet: any): RxWallet {
    return {
      availableRxCoinBalance: wallet.availableRxCoinBalance,
      pendingRxCoinBalance: wallet.pendingRxCoinBalance,
      totalRxCoinBalance: wallet.totalRxCoinBalance,
      availablePesoEquivalent: wallet.availablePesoEquivalent,
      pendingPesoEquivalent: wallet.pendingPesoEquivalent,
      conversionRateRxCoinPerPeso: wallet.conversionRateRxCoinPerPeso,
      withdrawalRequests: (wallet.withdrawalRequests || []).map((request: any) => this.normalizeWithdrawalRequest(request))
    };
  }

  private normalizeWithdrawalRequest(request: any): WithdrawalRequest {
    return {
      id: request.id,
      rxCoinAmount: request.rxCoinAmount,
      pesoAmount: request.pesoAmount,
      gcashNumber: request.gcashNumber ?? request.gCashNumber ?? '',
      gcashName: request.gcashName ?? request.gCashName ?? '',
      status: request.status,
      adminNotes: request.adminNotes ?? null,
      requestedAtUtc: request.requestedAtUtc,
      reviewedAtUtc: request.reviewedAtUtc ?? null,
      studentId: request.studentId ?? null,
      studentName: request.studentName ?? null,
      studentEmail: request.studentEmail ?? null,
      reviewedByAdminId: request.reviewedByAdminId ?? null,
      reviewedByAdminName: request.reviewedByAdminName ?? null
    };
  }
}
