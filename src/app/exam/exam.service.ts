import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ExamAttempt, SubmitExamAnswer, SubmitSingleAnswerResult } from '../shared/models/exam/exam-attempt';
import { Module, ModuleCreate } from '../shared/models/exam/module';
import { Question, QuestionCreate } from '../shared/models/exam/question';
import { RankingBoard } from '../shared/models/exam/ranking';
import { StudentPerformance } from '../shared/models/exam/student-performance';
import { Subject, SubjectCreate } from '../shared/models/exam/subject';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly baseUrl = `${environment.appUrl}/api`;

  constructor(private http: HttpClient) {}

  getModules() {
    return this.http.get<Module[]>(`${this.baseUrl}/modules`);
  }

  getModule(id: number) {
    return this.http.get<Module>(`${this.baseUrl}/modules/${id}`);
  }

  createModule(model: ModuleCreate) {
    return this.http.post<Module>(`${this.baseUrl}/modules`, model);
  }

  updateModule(id: number, model: ModuleCreate) {
    return this.http.put<Module>(`${this.baseUrl}/modules/${id}`, model);
  }

  deleteModule(id: number) {
    return this.http.delete(`${this.baseUrl}/modules/${id}`);
  }

  getSubjects(moduleId?: number) {
    const query = moduleId ? `?moduleId=${moduleId}` : '';
    return this.http.get<Subject[]>(`${this.baseUrl}/subjects${query}`);
  }

  getSubject(id: number) {
    return this.http.get<Subject>(`${this.baseUrl}/subjects/${id}`);
  }

  createSubject(model: SubjectCreate) {
    return this.http.post<Subject>(`${this.baseUrl}/subjects`, model);
  }

  updateSubject(id: number, model: SubjectCreate) {
    return this.http.put<Subject>(`${this.baseUrl}/subjects/${id}`, model);
  }

  deleteSubject(id: number) {
    return this.http.delete(`${this.baseUrl}/subjects/${id}`);
  }

  getQuestions(subjectId?: number, moduleId?: number) {
    const params: string[] = [];
    if (subjectId) {
      params.push(`subjectId=${subjectId}`);
    }
    if (moduleId) {
      params.push(`moduleId=${moduleId}`);
    }

    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Question[]>(`${this.baseUrl}/questions${query}`);
  }

  getQuestion(id: number) {
    return this.http.get<Question>(`${this.baseUrl}/questions/${id}`);
  }

  createQuestion(model: QuestionCreate) {
    return this.http.post<Question>(`${this.baseUrl}/questions`, model);
  }

  updateQuestion(id: number, model: QuestionCreate) {
    return this.http.put<Question>(`${this.baseUrl}/questions/${id}`, model);
  }

  deleteQuestion(id: number) {
    return this.http.delete(`${this.baseUrl}/questions/${id}`);
  }

  startAttempt(subjectId: number, questionSetNumber: number) {
    return this.http.post<ExamAttempt>(`${this.baseUrl}/examattempts/start`, { subjectId, questionSetNumber });
  }

  submitAnswer(attemptId: number, answer: SubmitExamAnswer) {
    return this.http.post<SubmitSingleAnswerResult>(`${this.baseUrl}/examattempts/${attemptId}/answer`, answer);
  }

  submitAttempt(attemptId: number, answers: SubmitExamAnswer[]) {
    return this.http.post<ExamAttempt>(`${this.baseUrl}/examattempts/${attemptId}/submit`, { answers });
  }

  getAttempt(attemptId: number) {
    return this.http.get<ExamAttempt>(`${this.baseUrl}/examattempts/${attemptId}`);
  }

  getMyAttempts() {
    return this.http.get<ExamAttempt[]>(`${this.baseUrl}/examattempts/my-attempts`);
  }

  getPerformance(moduleId?: number, subjectId?: number, studentId?: string) {
    const params: string[] = [];
    if (moduleId) {
      params.push(`moduleId=${moduleId}`);
    }
    if (subjectId) {
      params.push(`subjectId=${subjectId}`);
    }
    if (studentId) {
      params.push(`studentId=${studentId}`);
    }

    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<StudentPerformance[]>(`${this.baseUrl}/examattempts/performance${query}`);
  }

  getGlobalRanking(limit = 20) {
    return this.http.get<RankingBoard>(`${this.baseUrl}/rankings/global?limit=${limit}`);
  }

  getModuleRanking(moduleId: number, limit = 20) {
    return this.http.get<RankingBoard>(`${this.baseUrl}/rankings/modules/${moduleId}?limit=${limit}`);
  }

  awardCurrentRankingBadgesForTesting(topCount = 2) {
    return this.http.post<{ message: string; topCount: number; badgesAwarded: number; periodsFinalized: number }>(
      `${this.baseUrl}/rankings/test-award-current?topCount=${topCount}`,
      {}
    );
  }
}
