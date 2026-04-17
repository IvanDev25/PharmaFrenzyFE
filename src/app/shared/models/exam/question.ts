export interface Question {
  id: number;
  moduleId: number;
  moduleName: string;
  subjectId: number;
  subjectName: string;
  questionSetNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  defaultFeedback: string | null;
  score: number;
  timeLimitSeconds: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionCreate {
  subjectId: number;
  questionSetNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  defaultFeedback: string | null;
  score: number;
  timeLimitSeconds: number | null;
  isActive: boolean;
}
