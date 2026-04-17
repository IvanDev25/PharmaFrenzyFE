export interface SubjectQuestionSet {
  questionSetNumber: number;
  questionCount: number;
}

export interface Subject {
  id: number;
  moduleId: number;
  moduleName: string;
  name: string;
  description: string | null;
  isActive: boolean;
  questionCount: number;
  setCount: number;
  questionSets: SubjectQuestionSet[];
  createdAt: string;
  updatedAt: string;
}

export interface SubjectCreate {
  moduleId: number;
  name: string;
  description: string | null;
  isActive: boolean;
}
