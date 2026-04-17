import { WithdrawalRequest } from './withdrawal-request';

export interface RxWallet {
  availableRxCoinBalance: number;
  pendingRxCoinBalance: number;
  totalRxCoinBalance: number;
  availablePesoEquivalent: number;
  pendingPesoEquivalent: number;
  conversionRateRxCoinPerPeso: number;
  withdrawalRequests: WithdrawalRequest[];
}
