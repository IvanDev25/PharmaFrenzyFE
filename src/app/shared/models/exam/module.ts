export interface Module {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  subjectCount: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleCreate {
  name: string;
  description: string | null;
  isActive: boolean;
}
