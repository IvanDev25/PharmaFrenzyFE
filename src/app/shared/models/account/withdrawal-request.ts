export interface WithdrawalRequest {
  id: number;
  rxCoinAmount: number;
  pesoAmount: number;
  gcashNumber: string;
  gcashName: string;
  status: string;
  adminNotes: string | null;
  requestedAtUtc: string;
  reviewedAtUtc: string | null;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
  reviewedByAdminId: string | null;
  reviewedByAdminName: string | null;
}
