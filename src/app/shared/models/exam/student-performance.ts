export interface StudentPerformance {
  attemptId: number;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  moduleId: number;
  moduleName: string;
  subjectId: number;
  subjectName: string;
  questionSetNumber: number;
  status: string;
  totalScore: number;
  totalPossibleScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  startedAt: string;
  submittedAt: string | null;
}
