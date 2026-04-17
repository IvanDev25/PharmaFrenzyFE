import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AccountService } from '../account/account.service';
import { SharedService } from '../shared/shared.service';
import { WithdrawalRequest } from '../shared/models/account/withdrawal-request';

@Component({
  selector: 'app-admin-withdrawals',
  templateUrl: './admin-withdrawals.component.html',
  styleUrls: ['./admin-withdrawals.component.scss']
})
export class AdminWithdrawalsComponent implements OnInit {
  withdrawalRequests: WithdrawalRequest[] = [];
  loadingWithdrawalRequests = false;
  updatingWithdrawalId: number | null = null;
  selectedWithdrawalStatus = '';

  constructor(
    private readonly accountService: AccountService,
    private readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadWithdrawalRequests();
  }

  loadWithdrawalRequests(): void {
    this.loadingWithdrawalRequests = true;
    const status = this.selectedWithdrawalStatus || undefined;

    this.accountService.getWithdrawalRequests(status)
      .pipe(finalize(() => this.loadingWithdrawalRequests = false))
      .subscribe({
        next: requests => {
          this.withdrawalRequests = requests;
        },
        error: () => {
          this.withdrawalRequests = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load withdrawal requests.');
        }
      });
  }

  onWithdrawalStatusFilterChange(status: string): void {
    this.selectedWithdrawalStatus = status || '';
    this.loadWithdrawalRequests();
  }

  canApprove(request: WithdrawalRequest): boolean {
    return request.status === 'Pending';
  }

  canReject(request: WithdrawalRequest): boolean {
    return request.status === 'Pending';
  }

  canMarkPaid(request: WithdrawalRequest): boolean {
    return request.status === 'Approved';
  }

  updateWithdrawalStatus(request: WithdrawalRequest, status: 'Approved' | 'Rejected' | 'Paid' | 'Pending'): void {
    if (this.updatingWithdrawalId === request.id) {
      return;
    }

    if (
      (status === 'Approved' && !this.canApprove(request)) ||
      (status === 'Rejected' && !this.canReject(request)) ||
      (status === 'Paid' && !this.canMarkPaid(request))
    ) {
      return;
    }

    this.updatingWithdrawalId = request.id;
    this.accountService.updateWithdrawalRequestStatus(request.id, {
      status,
      adminNotes: null
    })
      .pipe(finalize(() => this.updatingWithdrawalId = null))
      .subscribe({
        next: updatedRequest => {
          this.withdrawalRequests = this.withdrawalRequests.map(existing =>
            existing.id === updatedRequest.id ? updatedRequest : existing
          );
          this.sharedService.showNotification(true, 'Withdrawal updated', `Request #${updatedRequest.id} is now ${updatedRequest.status}.`);
        },
        error: error => {
          this.sharedService.showNotification(false, 'Update failed', error?.error?.message || 'Unable to update the withdrawal request.');
        }
      });
  }
}
