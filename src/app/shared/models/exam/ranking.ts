export interface RankingEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  university: string | null;
  image: string | null;
  level: number;
  points: number;
  isCurrentStudent: boolean;
}

export interface RankingBoard {
  scope: string;
  moduleId: number | null;
  moduleName: string | null;
  periodLabel: string;
  periodStartUtc: string;
  resetAtUtc: string;
  currentStudentRank: number;
  currentStudentPoints: number;
  entries: RankingEntry[];
}
