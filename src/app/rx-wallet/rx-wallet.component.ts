import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { SharedService } from '../shared/shared.service';
import { RxWallet } from '../shared/models/account/rx-wallet';
import { User } from '../shared/models/account/user';

@Component({
  selector: 'app-rx-wallet',
  templateUrl: './rx-wallet.component.html',
  styleUrls: ['./rx-wallet.component.scss']
})
export class RxWalletComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  walletLoading = false;
  submittingWithdrawal = false;
  wallet: RxWallet | null = null;

  withdrawalForm = this.fb.group({
    rxCoinAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    gcashNumber: ['', [Validators.required, Validators.maxLength(50)]],
    gcashName: ['', [Validators.required, Validators.maxLength(150)]]
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly accountService: AccountService,
    private readonly sharedService: SharedService,
    private readonly fb: FormBuilder
  ) {
    this.user$ = this.accountService.user$;
  }

  ngOnInit(): void {
    this.loadWallet();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get requestedRxCoinAmount(): number {
    return Number(this.withdrawalForm.value.rxCoinAmount) || 0;
  }

  get withdrawalPesoEquivalent(): number {
    if (!this.wallet?.conversionRateRxCoinPerPeso || this.requestedRxCoinAmount <= 0) {
      return 0;
    }

    return this.requestedRxCoinAmount / this.wallet.conversionRateRxCoinPerPeso;
  }

  submitWithdrawal(): void {
    if (this.withdrawalForm.invalid) {
      this.withdrawalForm.markAllAsTouched();
      return;
    }

    const model = {
      rxCoinAmount: Number(this.withdrawalForm.value.rxCoinAmount) || 0,
      gcashNumber: this.withdrawalForm.value.gcashNumber?.trim() || '',
      gcashName: this.withdrawalForm.value.gcashName?.trim() || ''
    };

    this.submittingWithdrawal = true;
    this.accountService.createWithdrawalRequest(model)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submittingWithdrawal = false)
      )
      .subscribe({
        next: wallet => {
          this.wallet = wallet;
          this.withdrawalForm.reset({
            rxCoinAmount: null,
            gcashNumber: model.gcashNumber,
            gcashName: model.gcashName
          });
          this.sharedService.showNotification(true, 'Withdrawal requested', 'Your RxCoin withdrawal request was sent for admin review.');
        },
        error: error => {
          this.sharedService.showNotification(false, 'Request failed', error?.error?.message || 'Unable to submit your withdrawal request.');
        }
      });
  }

  private loadWallet(): void {
    this.walletLoading = true;
    this.accountService.getMyRxWallet()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.walletLoading = false)
      )
      .subscribe({
        next: wallet => {
          this.wallet = wallet;
          this.withdrawalForm.patchValue({
            gcashNumber: wallet.withdrawalRequests?.[0]?.gcashNumber || '',
            gcashName: wallet.withdrawalRequests?.[0]?.gcashName || ''
          }, { emitEvent: false });
        },
        error: () => {
          this.wallet = null;
          this.sharedService.showNotification(false, 'Wallet unavailable', 'Unable to load your RxWallet right now.');
        }
      });
  }
}
