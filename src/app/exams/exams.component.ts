import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService, DailyStreakStatus } from '../account/account.service';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { ExamAttempt } from '../shared/models/exam/exam-attempt';
import { Module } from '../shared/models/exam/module';
import { Subject, SubjectQuestionSet } from '../shared/models/exam/subject';

@Component({
  selector: 'app-exams',
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.scss']
})
export class ExamsComponent implements OnInit, OnDestroy {
  readonly streakDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  private readonly studentWelcomeStorageKey = 'show-student-home-welcome';
  modules: Module[] = [];
  subjects: Subject[] = [];
  attempts: ExamAttempt[] = [];
  moduleProgress: Record<number, { completedSets: number; totalSets: number; percentage: number }> = {};
  loadingModules = false;
  loadingSubjects = false;
  startingSubjectId: string | null = null;
  viewedModuleId: number | null = null;
  currentRole: string | null = null;
  showStudentWelcome = false;
  dailyStreakStatus: DailyStreakStatus | null = null;
  redeemingDailyStreak = false;
  private welcomeTimeoutId: number | null = null;
  private readonly destroy$ = new RxSubject<void>();

  constructor(
    private examService: ExamService,
    private accountService: AccountService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentRole = user?.role ?? null;
        if (
          user?.role === 'Student' &&
          sessionStorage.getItem(this.studentWelcomeStorageKey) === 'true' &&
          this.welcomeTimeoutId === null &&
          !this.showStudentWelcome
        ) {
          this.queueDailyStreakModal();
        }
      });

    this.loadSubjects();
    this.loadAttempts();
    this.loadModules();
  }

  ngOnDestroy(): void {
    if (this.welcomeTimeoutId !== null) {
      window.clearTimeout(this.welcomeTimeoutId);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  get loading(): boolean {
    return this.loadingModules || this.loadingSubjects;
  }

  get viewedModule(): Module | null {
    return this.modules.find(module => module.id === this.viewedModuleId) ?? null;
  }

  get viewedSubjects(): Subject[] {
    if (!this.viewedModuleId) {
      return [];
    }

    return this.subjects.filter(subject => subject.moduleId === this.viewedModuleId);
  }

  loadModules(): void {
    this.loadingModules = true;
    this.examService.getModules()
      .pipe(finalize(() => this.loadingModules = false))
      .subscribe({
        next: modules => {
          this.modules = modules.filter(module => module.isActive);
          this.refreshModuleProgress();
        },
        error: () => {
          this.modules = [];
          this.moduleProgress = {};
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load exam modules.');
        }
      });
  }

  loadSubjects(): void {
    this.loadingSubjects = true;
    this.examService.getSubjects()
      .pipe(finalize(() => this.loadingSubjects = false))
      .subscribe({
        next: subjects => {
          this.subjects = subjects.filter(subject => subject.isActive);
          this.refreshModuleProgress();
        },
        error: () => {
          this.subjects = [];
          this.moduleProgress = {};
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load exam subjects.');
        }
      });
  }

  startExam(subjectId: number, questionSetNumber: number): void {
    const subject = this.subjects.find(item => item.id === subjectId);
    if (subject && this.isSetLocked(subject, questionSetNumber)) {
      this.sharedService.showNotification(
        false,
        'Set locked',
        this.lockedSetMessage(subject, questionSetNumber)
      );
      return;
    }

    this.startingSubjectId = this.toSetKey(subjectId, questionSetNumber);
    const activeAttempt = this.getInProgressAttempt(subjectId, questionSetNumber);
    if (activeAttempt) {
      this.router.navigate(['/exams/attempt', activeAttempt.attemptId]);
      this.startingSubjectId = null;
      return;
    }

    this.examService.startAttempt(subjectId, questionSetNumber)
      .pipe(finalize(() => this.startingSubjectId = null))
      .subscribe({
        next: attempt => {
          this.upsertAttempt(attempt);
          this.router.navigate(['/exams/attempt', attempt.attemptId]);
        },
        error: (error) => {
          this.sharedService.showNotification(false, 'Unable to start', error?.error?.message || 'Could not start the exam.');
        }
      });
  }

  openHistory(): void {
    this.router.navigate(['/exams/history']);
  }

  closeStudentWelcome(): void {
    this.showStudentWelcome = false;
    this.dailyStreakStatus = null;
    sessionStorage.removeItem(this.studentWelcomeStorageKey);
  }

  redeemDailyStreak(): void {
    if (!this.dailyStreakStatus) {
      this.closeStudentWelcome();
      return;
    }

    if (!this.dailyStreakStatus.canRedeemToday || this.redeemingDailyStreak) {
      this.closeStudentWelcome();
      return;
    }

    this.redeemingDailyStreak = true;
    this.accountService.redeemDailyStreak()
      .pipe(finalize(() => this.redeemingDailyStreak = false))
      .subscribe({
        next: status => {
          this.dailyStreakStatus = {
            ...status,
            canRedeemToday: false
          };
          this.closeStudentWelcome();
          this.sharedService.showDailyStreakModal({
            currentStreak: status.currentStreak,
            rewardPoints: status.rewardPoints
          });
        },
        error: error => {
          this.sharedService.showNotification(
            false,
            'Redeem failed',
            error?.error?.message || 'Unable to redeem the daily streak reward.'
          );
        }
      });
  }

  viewModule(moduleId: number): void {
    this.viewedModuleId = this.viewedModuleId === moduleId ? null : moduleId;
  }

  trackByModule(_: number, module: Module): number {
    return module.id;
  }

  trackBySubject(_: number, subject: Subject): number {
    return subject.id;
  }

  hasInProgressAttempt(subjectId: number, questionSetNumber: number): boolean {
    return !!this.getInProgressAttempt(subjectId, questionSetNumber);
  }

  examButtonLabel(subject: Subject, questionSetNumber: number): string {
    if (this.isSetLocked(subject, questionSetNumber)) {
      return 'Locked';
    }

    const subjectId = subject.id;
    const setKey = this.toSetKey(subjectId, questionSetNumber);
    if (this.startingSubjectId === setKey) {
      return this.hasInProgressAttempt(subjectId, questionSetNumber) ? 'Continuing...' : 'Starting...';
    }

    return this.hasInProgressAttempt(subjectId, questionSetNumber) ? 'Continue Exam' : 'Start Exam';
  }

  moduleButtonLabel(moduleId: number): string {
    return this.viewedModuleId === moduleId ? 'Hide Subjects' : 'View Subjects';
  }

  claimedStreakDays(): number {
    if (!this.dailyStreakStatus) {
      return 0;
    }

    return this.dailyStreakStatus.canRedeemToday
      ? Math.max(this.dailyStreakStatus.currentStreak - 1, 0)
      : this.dailyStreakStatus.currentStreak;
  }

  isClaimedStreakDay(index: number): boolean {
    return index < this.claimedStreakDays();
  }

  isCurrentRedeemableDay(index: number): boolean {
    return !!this.dailyStreakStatus?.canRedeemToday && index === this.claimedStreakDays();
  }

  getModuleProgress(moduleId: number): { completedSets: number; totalSets: number; percentage: number } {
    return this.moduleProgress[moduleId] ?? { completedSets: 0, totalSets: 0, percentage: 0 };
  }

  trackByQuestionSet(_: number, questionSet: SubjectQuestionSet): number {
    return questionSet.questionSetNumber;
  }

  isSetPerfected(subjectId: number, questionSetNumber: number): boolean {
    return this.attempts.some(attempt =>
      attempt.subjectId === subjectId &&
      attempt.questionSetNumber === questionSetNumber &&
      attempt.status === 'Submitted' &&
      attempt.totalPossibleScore > 0 &&
      attempt.totalScore >= attempt.totalPossibleScore
    );
  }

  latestSubmittedAttempt(subjectId: number, questionSetNumber: number): ExamAttempt | null {
    return this.attempts.find(attempt =>
      attempt.subjectId === subjectId &&
      attempt.questionSetNumber === questionSetNumber &&
      attempt.status === 'Submitted'
    ) ?? null;
  }

  questionSetStatusLabel(subject: Subject, questionSetNumber: number): string {
    if (this.isSetLocked(subject, questionSetNumber)) {
      return 'Locked';
    }

    const subjectId = subject.id;
    if (this.isSetPerfected(subjectId, questionSetNumber)) {
      return 'DONE';
    }

    if (this.hasInProgressAttempt(subjectId, questionSetNumber)) {
      return 'In Progress';
    }

    return 'Ready';
  }

  isStartingSet(subjectId: number, questionSetNumber: number): boolean {
    return this.startingSubjectId === this.toSetKey(subjectId, questionSetNumber);
  }

  isSetLocked(subject: Subject, questionSetNumber: number): boolean {
    if (this.hasInProgressAttempt(subject.id, questionSetNumber)) {
      return false;
    }

    const orderedSetNumbers = this.getOrderedSetNumbers(subject);
    const currentIndex = orderedSetNumbers.indexOf(questionSetNumber);
    if (currentIndex <= 0) {
      return false;
    }

    const previousSetNumber = orderedSetNumbers[currentIndex - 1];
    return !this.isSetPerfected(subject.id, previousSetNumber);
  }

  lockedSetMessage(subject: Subject, questionSetNumber: number): string {
    const orderedSetNumbers = this.getOrderedSetNumbers(subject);
    const currentIndex = orderedSetNumbers.indexOf(questionSetNumber);
    if (currentIndex <= 0) {
      return 'This set is ready to start.';
    }

    const previousSetNumber = orderedSetNumbers[currentIndex - 1];
    return `Perfect Set ${previousSetNumber} first to unlock Set ${questionSetNumber}.`;
  }

  private loadAttempts(): void {
    this.examService.getMyAttempts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: attempts => {
        this.attempts = attempts;
        this.refreshModuleProgress();
      },
      error: () => {
        this.attempts = [];
        this.refreshModuleProgress();
      }
      });
  }

  private getInProgressAttempt(subjectId: number, questionSetNumber: number): ExamAttempt | undefined {
    return this.attempts.find(attempt =>
      attempt.subjectId === subjectId &&
      attempt.questionSetNumber === questionSetNumber &&
      attempt.status === 'InProgress');
  }

  private upsertAttempt(attempt: ExamAttempt): void {
    const index = this.attempts.findIndex(existing => existing.attemptId === attempt.attemptId);
    if (index >= 0) {
      this.attempts[index] = attempt;
      this.refreshModuleProgress();
      return;
    }

    this.attempts = [attempt, ...this.attempts];
    this.refreshModuleProgress();
  }

  private refreshModuleProgress(): void {
    const progress: Record<number, { completedSets: number; totalSets: number; percentage: number }> = {};
    const completedSetsByModule = new Map<number, Set<string>>();

    for (const attempt of this.attempts) {
      if (attempt.status !== 'Submitted' || attempt.totalPossibleScore <= 0 || attempt.totalScore < attempt.totalPossibleScore) {
        continue;
      }

      const completedSets = completedSetsByModule.get(attempt.moduleId) ?? new Set<string>();
      completedSets.add(this.toSetKey(attempt.subjectId, attempt.questionSetNumber));
      completedSetsByModule.set(attempt.moduleId, completedSets);
    }

    for (const module of this.modules) {
      const totalSets = this.subjects
        .filter(subject => subject.moduleId === module.id)
        .reduce((sum, subject) => sum + (subject.questionSets?.length || 0), 0);
      const completedSets = completedSetsByModule.get(module.id)?.size ?? 0;

      progress[module.id] = {
        completedSets,
        totalSets,
        percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
      };
    }

    this.moduleProgress = progress;
  }

  private toSetKey(subjectId: number, questionSetNumber: number): string {
    return `${subjectId}:${questionSetNumber}`;
  }

  private getOrderedSetNumbers(subject: Subject): number[] {
    return [...(subject.questionSets ?? [])]
      .map(set => set.questionSetNumber)
      .sort((a, b) => a - b);
  }

  private queueDailyStreakModal(): void {
    this.welcomeTimeoutId = window.setTimeout(() => {
      this.accountService.getDailyStreakStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: status => {
            if (status.canRedeemToday) {
              this.dailyStreakStatus = status;
              this.showStudentWelcome = true;
            } else {
              sessionStorage.removeItem(this.studentWelcomeStorageKey);
            }

            this.welcomeTimeoutId = null;
          },
          error: () => {
            sessionStorage.removeItem(this.studentWelcomeStorageKey);
            this.welcomeTimeoutId = null;
          }
        });
    }, 1200);
  }
}
