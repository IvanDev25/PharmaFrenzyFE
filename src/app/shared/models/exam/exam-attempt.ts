export interface StudentQuestionOption {
  value: string;
  text: string;
}

export interface StudentQuestion {
  questionId: number;
  questionText: string;
  options: StudentQuestionOption[];
  score: number;
  timeLimitSeconds: number | null;
}

export interface AttemptAnswerResult {
  questionId: number;
  questionText: string;
  selectedAnswer: string | null;
  selectedAnswerText: string | null;
  correctAnswer: string | null;
  correctAnswerText: string | null;
  isCorrect: boolean;
  scoreEarned: number;
  timeSpentSeconds: number;
  explanation: string | null;
  feedback: string | null;
}

export interface ExamAttempt {
  attemptId: number;
  moduleId: number;
  moduleName: string;
  subjectId: number;
  subjectName: string;
  questionSetNumber: number;
  studentId: string;
  startedAt: string;
  submittedAt: string | null;
  status: string;
  totalScore: number;
  totalPossibleScore: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  overallFeedback: string | null;
  experienceGained: number;
  studentExperiencePoints: number;
  previousStudentLevel: number;
  studentLevel: number;
  leveledUp: boolean;
  questions: StudentQuestion[];
  answers: AttemptAnswerResult[];
}

export interface SubmitExamAnswer {
  questionId: number;
  selectedAnswer: string | null;
  timeSpentSeconds: number;
}

export interface SubmitSingleAnswerResult {
  attemptCompleted: boolean;
  answer: AttemptAnswerResult;
  attempt: ExamAttempt | null;
}
