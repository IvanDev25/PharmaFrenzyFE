import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, take } from 'rxjs';
import { AccountService } from '../account/account.service';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { AttemptAnswerResult, ExamAttempt, StudentQuestion, StudentQuestionOption } from '../shared/models/exam/exam-attempt';

@Component({
  selector: 'app-exam-attempt',
  templateUrl: './exam-attempt.component.html',
  styleUrls: ['./exam-attempt.component.scss']
})
export class ExamAttemptComponent implements OnInit, OnDestroy {
  attempt: ExamAttempt | null = null;
  loading = false;
  submitting = false;
  currentIndex = 0;
  selectedAnswer: string | null = null;
  currentAnswerResult: AttemptAnswerResult | null = null;
  examCompleted = false;
  showResultSummary = false;
  questionStartedAt = Date.now();
  remainingSeconds: number | null = null;
  private routeSub?: Subscription;
  private timerId?: ReturnType<typeof setInterval>;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private examService: ExamService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const attemptId = Number(params.get('attemptId'));
      if (!attemptId) {
        this.router.navigate(['/exams']);
        return;
      }

      this.loadAttempt(attemptId);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.stopTimer();
  }

  loadAttempt(attemptId: number): void {
    this.loading = true;
    this.examService.getAttempt(attemptId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: attempt => {
          this.attempt = attempt;
          this.examCompleted = false;
          this.showResultSummary = false;
          if (attempt.status === 'InProgress') {
            const nextQuestionIndex = attempt.answers.length;
            this.currentIndex = Math.min(nextQuestionIndex, Math.max(attempt.questions.length - 1, 0));
            this.currentAnswerResult = null;
            this.selectedAnswer = null;
            this.startCurrentQuestion();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.sharedService.showNotification(false, 'Not found', 'Unable to load this exam attempt.');
          this.router.navigate(['/exams']);
          this.cdr.markForCheck();
        }
      });
  }

  get currentQuestion(): StudentQuestion | null {
    if (!this.attempt?.questions?.length) {
      return null;
    }

    return this.attempt.questions[this.currentIndex];
  }

  get showQuestionView(): boolean {
    if (!this.attempt) {
      return false;
    }

    return this.attempt.status === 'InProgress' || (this.examCompleted && !this.showResultSummary);
  }

  get isLastQuestion(): boolean {
    return !!this.attempt?.questions?.length && this.currentIndex === this.attempt.questions.length - 1;
  }

  get actionButtonLabel(): string {
    if (!this.currentAnswerResult) {
      return this.submitting ? 'Checking...' : 'Check Answer';
    }

    if (this.examCompleted) {
      return 'Result';
    }

    return 'Next Question';
  }

  get hasTimer(): boolean {
    return !this.examCompleted && !!this.currentQuestion?.timeLimitSeconds;
  }

  get canGoPrevious(): boolean {
    return this.examCompleted && this.currentIndex > 0;
  }

  get canGoNextReview(): boolean {
    return this.examCompleted && !!this.attempt?.questions?.length && this.currentIndex < this.attempt.questions.length - 1;
  }

  chooseAnswer(option: string): void {
    if (this.currentAnswerResult || this.submitting) {
      return;
    }

    this.selectedAnswer = option;
  }

  goNext(): void {
    if (!this.attempt?.questions || !this.currentAnswerResult) {
      return;
    }

    if (this.currentIndex < this.attempt.questions.length - 1) {
      this.currentIndex++;
      this.currentAnswerResult = null;
      this.selectedAnswer = null;
      this.startCurrentQuestion();
    }
  }

  handlePrimaryAction(): void {
    if (!this.currentAnswerResult) {
      this.submitCurrentAnswer();
      return;
    }

    if (this.examCompleted) {
      this.showResultSummary = true;
      return;
    }

    this.goNext();
  }

  goPreviousReview(): void {
    if (!this.canGoPrevious) {
      return;
    }

    this.currentIndex--;
    this.syncReviewState();
  }

  goNextReview(): void {
    if (!this.canGoNextReview) {
      return;
    }

    this.currentIndex++;
    this.syncReviewState();
  }

  submitCurrentAnswer(autoSubmit: boolean = false): void {
    if (!this.attempt || !this.currentQuestion || this.currentAnswerResult) {
      return;
    }

    if (!this.selectedAnswer && !autoSubmit) {
      this.sharedService.showNotification(false, 'Answer required', 'Please choose an answer before continuing.');
      return;
    }

    this.submitting = true;
    const question = this.currentQuestion;
    const timeSpentSeconds = this.captureCurrentQuestionTime();

    this.examService.submitAnswer(this.attempt.attemptId, {
      questionId: question.questionId,
      selectedAnswer: this.selectedAnswer,
      timeSpentSeconds
    })
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: result => {
          this.stopTimer();
          this.currentAnswerResult = result.answer;

          if (result.attemptCompleted && result.attempt) {
            this.attempt = {
              ...result.attempt,
              questions: this.attempt?.questions ?? []
            };
            this.examCompleted = true;
            this.showResultSummary = false;
            this.selectedAnswer = result.answer.selectedAnswer;

            const jwt = this.accountService.getJWT();
            if (jwt) {
              this.accountService.refreshUser(jwt).subscribe();
            }

            const modalRef = this.sharedService.showExamCompleteModal({
              subjectName: result.attempt.subjectName,
              totalScore: result.attempt.totalScore,
              totalPossibleScore: result.attempt.totalPossibleScore,
              correctAnswers: result.attempt.correctAnswers,
              wrongAnswers: result.attempt.wrongAnswers,
              overallFeedback: result.attempt.overallFeedback,
              experienceGained: result.attempt.experienceGained,
              previousStudentLevel: result.attempt.previousStudentLevel,
              studentLevel: result.attempt.studentLevel,
              studentExperiencePoints: result.attempt.studentExperiencePoints,
              leveledUp: result.attempt.leveledUp,
              nextLevelExperienceRequired: result.attempt.studentLevel * 100,
              currentLevelExperience: this.currentLevelExperience(result.attempt.studentExperiencePoints, result.attempt.studentLevel)
            });

            modalRef?.onHidden?.pipe(take(1)).subscribe(() => {
              if (!modalRef.content?.viewResults) {
                return;
              }

              this.showResultSummary = true;
              this.cdr.markForCheck();

              if (result.attempt?.leveledUp) {
                window.setTimeout(() => {
                  this.sharedService.showLevelUpModal({
                    previousStudentLevel: result.attempt!.previousStudentLevel,
                    studentLevel: result.attempt!.studentLevel
                  });
                }, 3000);
              }
            });
            this.cdr.markForCheck();
            return;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.sharedService.showNotification(false, 'Answer failed', error?.error?.message || 'Unable to save your answer.');
          this.cdr.markForCheck();
        }
      });
  }

  goToHistory(): void {
    this.router.navigate(['/exams/history']);
  }

  answerText(value: string | null, text: string | null): string {
    if (!value) {
      return 'No answer';
    }

    return text || 'No answer text available.';
  }

  formattedTime(): string {
    if (this.remainingSeconds == null) {
      return '';
    }

    const minutes = Math.floor(this.remainingSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.remainingSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  optionState(option: string): string {
    if (!this.currentAnswerResult) {
      return '';
    }

    if (this.currentAnswerResult.correctAnswer === option) {
      return 'correct';
    }

    if (this.currentAnswerResult.correctAnswer !== option) {
      return 'wrong';
    }

    return '';
  }

  optionDisplayLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  trackOption(_: number, option: StudentQuestionOption): string {
    return option.value;
  }

  private currentLevelExperience(totalExperience: number, level: number): number {
    return Math.max(0, totalExperience - this.totalExperienceRequiredForLevel(level));
  }

  private totalExperienceRequiredForLevel(level: number): number {
    if (level <= 1) {
      return 0;
    }

    return ((level - 1) * level / 2) * 100;
  }

  private syncReviewState(): void {
    if (!this.attempt?.answers?.length || !this.attempt?.questions?.length) {
      this.currentAnswerResult = null;
      this.selectedAnswer = null;
      return;
    }

    const question = this.currentQuestion;
    if (!question) {
      this.currentAnswerResult = null;
      this.selectedAnswer = null;
      return;
    }

    this.stopTimer();
    this.remainingSeconds = null;
    this.currentAnswerResult = this.attempt.answers.find(answer => answer.questionId === question.questionId) ?? null;
    this.selectedAnswer = this.currentAnswerResult?.selectedAnswer ?? null;
    this.cdr.markForCheck();
  }

  private startCurrentQuestion(): void {
    const question = this.currentQuestion;
    if (!question) {
      return;
    }

    this.stopTimer();
    this.questionStartedAt = Date.now();
    this.remainingSeconds = question.timeLimitSeconds ?? null;

    if (this.remainingSeconds && this.remainingSeconds > 0) {
      this.timerId = setInterval(() => {
        if (this.remainingSeconds == null) {
          return;
        }

        if (this.remainingSeconds <= 1) {
          this.remainingSeconds = 0;
          this.cdr.markForCheck();
          this.stopTimer();
          this.submitCurrentAnswer(true);
          return;
        }

        this.remainingSeconds -= 1;
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  private captureCurrentQuestionTime(): number {
    const question = this.currentQuestion;
    if (!question) {
      return 0;
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - this.questionStartedAt) / 1000));
    if (question.timeLimitSeconds && question.timeLimitSeconds > 0) {
      return Math.min(elapsedSeconds, question.timeLimitSeconds);
    }

    return elapsedSeconds;
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }
}
