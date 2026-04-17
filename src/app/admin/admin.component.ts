import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccountService } from '../account/account.service';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { User } from '../shared/models/account/user';
import { Module, ModuleCreate } from '../shared/models/exam/module';
import { Question, QuestionCreate } from '../shared/models/exam/question';
import { StudentPerformance } from '../shared/models/exam/student-performance';
import { Subject, SubjectCreate } from '../shared/models/exam/subject';
import { getLevelBadgeAsset } from '../shared/utils/level-badge.util';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  readonly displayedColumns: string[] = ['name', 'role', 'level', 'status', 'actions'];
  readonly adminDisplayedColumns: string[] = ['name', 'role', 'status'];

  modules: Module[] = [];
  students: User[] = [];
  admins: User[] = [];
  subjects: Subject[] = [];
  questions: Question[] = [];
  performanceRecords: StudentPerformance[] = [];
  loadingModules = false;
  loadingStudents = false;
  loadingAdmins = false;
  loadingSubjects = false;
  loadingQuestions = false;
  loadingPerformance = false;
  savingModule = false;
  savingSubject = false;
  savingQuestion = false;
  enablingStreakStudentId: string | null = null;
  awardingCurrentRankingBadges = false;
  selectedModuleId = 0;
  selectedSubjectId = 0;
  selectedPerformanceModuleId = 0;
  selectedPerformanceSubjectId = 0;
  selectedPerformanceStudentId = '';
  selectedUserTab: 'students' | 'admins' = 'students';
  editingModuleId: number | null = null;
  editingSubjectId: number | null = null;
  editingQuestionId: number | null = null;

  moduleForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(500)],
    isActive: [true]
  });

  subjectForm = this.fb.group({
    moduleId: [null as number | null, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(500)],
    isActive: [true]
  });

  questionForm = this.fb.group({
    subjectId: [null as number | null, Validators.required],
    questionSetNumber: [1, [Validators.required, Validators.min(1)]],
    questionText: ['', Validators.required],
    optionA: ['', Validators.required],
    optionB: ['', Validators.required],
    optionC: ['', Validators.required],
    optionD: ['', Validators.required],
    correctAnswer: ['A', Validators.required],
    explanation: [''],
    defaultFeedback: [''],
    score: [1, [Validators.required, Validators.min(1)]],
    timeLimitSeconds: [null as number | null],
    isActive: [true]
  });

  constructor(
    private accountService: AccountService,
    private examService: ExamService,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsersByRole('Student');
    this.loadUsersByRole('Admin');
    this.loadModules();
    this.loadSubjects();
    this.loadQuestions();
    this.loadPerformance();
  }

  get activeSection(): 'users' | 'modules' | 'subjects' | 'questions' | 'performance' {
    const url = this.router.url.toLowerCase();

    if (url.includes('/admin/modules')) {
      return 'modules';
    }

    if (url.includes('/admin/subjects')) {
      return 'subjects';
    }

    if (url.includes('/admin/questions')) {
      return 'questions';
    }

    if (url.includes('/admin/performance')) {
      return 'performance';
    }

    return 'users';
  }

  get showModuleTabs(): boolean {
    return this.activeSection === 'modules' || this.activeSection === 'subjects' || this.activeSection === 'questions';
  }

  selectUserTab(tab: 'students' | 'admins'): void {
    this.selectedUserTab = tab;
  }

  loadUsersByRole(role: 'Student' | 'Admin'): void {
    if (role === 'Student') {
      this.loadingStudents = true;
    } else {
      this.loadingAdmins = true;
    }

    this.accountService.getUsersByRole(role).subscribe({
      next: (users) => {
        if (role === 'Student') {
          this.students = users;
          this.loadingStudents = false;
        } else {
          this.admins = users;
          this.loadingAdmins = false;
        }
      },
      error: () => {
        if (role === 'Student') {
          this.students = [];
          this.loadingStudents = false;
        } else {
          this.admins = [];
          this.loadingAdmins = false;
        }
      }
    });
  }

  enableStudentStreak(user: User): void {
    if (!user.id || this.enablingStreakStudentId === user.id) {
      return;
    }

    this.enablingStreakStudentId = user.id;
    this.accountService.enableDailyStreakForTesting(user.id)
      .pipe(finalize(() => this.enablingStreakStudentId = null))
      .subscribe({
        next: () => {
          this.sharedService.showNotification(
            true,
            'Streak ready',
            `${user.firstName} ${user.lastName} can now see the streak reward on their next login.`
          );
          this.loadUsersByRole('Student');
        },
        error: (error) => {
          this.sharedService.showNotification(
            false,
            'Action failed',
            error?.error?.message || 'Unable to enable the streak test for this student.'
          );
        }
      });
  }

  awardCurrentRankingBadgesForTesting(): void {
    if (this.awardingCurrentRankingBadges) {
      return;
    }

    this.awardingCurrentRankingBadges = true;
    this.examService.awardCurrentRankingBadgesForTesting(3)
      .pipe(finalize(() => this.awardingCurrentRankingBadges = false))
      .subscribe({
        next: result => {
          this.sharedService.showNotification(
            true,
            'Ranking badges awarded',
            `Awarded current top ${result.topCount} Global and Module ranking badges. ${result.badgesAwarded} badges were created across ${result.periodsFinalized} ranking periods.`
          );
        },
        error: (error) => {
          this.sharedService.showNotification(
            false,
            'Award failed',
            error?.error?.message || 'Unable to award the current ranking badges for testing.'
          );
        }
      });
  }

  loadModules(): void {
    this.loadingModules = true;
    this.examService.getModules()
      .pipe(finalize(() => this.loadingModules = false))
      .subscribe({
        next: modules => {
          this.modules = modules;
          if (this.subjectForm.value.moduleId == null && modules.length) {
            this.subjectForm.patchValue({ moduleId: modules[0].id });
          }
        },
        error: () => {
          this.modules = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load modules.');
        }
      });
  }

  loadSubjects(): void {
    this.loadingSubjects = true;
    this.examService.getSubjects()
      .pipe(finalize(() => this.loadingSubjects = false))
      .subscribe({
        next: subjects => {
          this.subjects = subjects;
          if (this.subjectForm.value.moduleId == null && subjects.length) {
            this.subjectForm.patchValue({ moduleId: subjects[0].moduleId });
          }

          if (this.questionForm.value.subjectId == null && subjects.length) {
            this.questionForm.patchValue({ subjectId: subjects[0].id });
          }
        },
        error: () => {
          this.subjects = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load subjects.');
        }
      });
  }

  loadQuestions(): void {
    this.loadingQuestions = true;
    const moduleId = this.selectedModuleId || undefined;
    const subjectId = this.selectedSubjectId || undefined;
    this.examService.getQuestions(subjectId, moduleId)
      .pipe(finalize(() => this.loadingQuestions = false))
      .subscribe({
        next: questions => {
          this.questions = questions;
        },
        error: () => {
          this.questions = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load questions.');
        }
      });
  }

  loadPerformance(): void {
    this.loadingPerformance = true;
    const moduleId = this.selectedPerformanceModuleId || undefined;
    const subjectId = this.selectedPerformanceSubjectId || undefined;
    const studentId = this.selectedPerformanceStudentId || undefined;

    this.examService.getPerformance(moduleId, subjectId, studentId)
      .pipe(finalize(() => this.loadingPerformance = false))
      .subscribe({
        next: performance => {
          this.performanceRecords = performance;
        },
        error: () => {
          this.performanceRecords = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load student performance.');
        }
      });
  }

  submitModule(): void {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    this.savingModule = true;
    const model: ModuleCreate = {
      name: this.moduleForm.value.name?.trim() || '',
      description: this.moduleForm.value.description?.trim() || null,
      isActive: !!this.moduleForm.value.isActive
    };

    const request = this.editingModuleId
      ? this.examService.updateModule(this.editingModuleId, model)
      : this.examService.createModule(model);

    request.pipe(finalize(() => this.savingModule = false)).subscribe({
      next: () => {
        this.resetModuleForm();
        this.loadModules();
        this.sharedService.showNotification(true, 'Module saved', 'The module has been saved successfully.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Save failed', error?.error?.message || 'Unable to save the module.');
      }
    });
  }

  editModule(module: Module): void {
    this.editingModuleId = module.id;
    this.moduleForm.patchValue({
      name: module.name,
      description: module.description || '',
      isActive: module.isActive
    });
  }

  deleteModule(module: Module): void {
    if (!confirm(`Delete module "${module.name}"?`)) {
      return;
    }

    this.examService.deleteModule(module.id).subscribe({
      next: () => {
        if (this.selectedModuleId === module.id) {
          this.selectedModuleId = 0;
        }

        if (this.subjectForm.value.moduleId === module.id) {
          this.subjectForm.patchValue({ moduleId: this.modules.find(x => x.id !== module.id)?.id ?? null });
        }

        this.loadModules();
        this.loadSubjects();
        this.loadQuestions();
        this.sharedService.showNotification(true, 'Module deleted', 'The module has been removed.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Delete failed', error?.error?.message || 'Unable to delete the module.');
      }
    });
  }

  resetModuleForm(): void {
    this.editingModuleId = null;
    this.moduleForm.reset({
      name: '',
      description: '',
      isActive: true
    });
  }

  onModuleFilterChange(moduleId: string): void {
    this.selectedModuleId = Number(moduleId) || 0;

    if (this.selectedSubjectId) {
      const selectedSubject = this.subjects.find(subject => subject.id === this.selectedSubjectId);
      if (selectedSubject && this.selectedModuleId && selectedSubject.moduleId !== this.selectedModuleId) {
        this.selectedSubjectId = 0;
      }
    }

    this.loadQuestions();
  }

  onPerformanceModuleFilterChange(moduleId: string): void {
    this.selectedPerformanceModuleId = Number(moduleId) || 0;

    if (this.selectedPerformanceSubjectId) {
      const selectedSubject = this.subjects.find(subject => subject.id === this.selectedPerformanceSubjectId);
      if (selectedSubject && this.selectedPerformanceModuleId && selectedSubject.moduleId !== this.selectedPerformanceModuleId) {
        this.selectedPerformanceSubjectId = 0;
      }
    }

    this.loadPerformance();
  }

  onSubjectFilterChange(subjectId: string): void {
    this.selectedSubjectId = Number(subjectId) || 0;

    const selectedSubject = this.subjects.find(subject => subject.id === this.selectedSubjectId);
    if (selectedSubject) {
      this.selectedModuleId = selectedSubject.moduleId;
    }

    this.loadQuestions();
  }

  onPerformanceSubjectFilterChange(subjectId: string): void {
    this.selectedPerformanceSubjectId = Number(subjectId) || 0;

    const selectedSubject = this.subjects.find(subject => subject.id === this.selectedPerformanceSubjectId);
    if (selectedSubject) {
      this.selectedPerformanceModuleId = selectedSubject.moduleId;
    }

    this.loadPerformance();
  }

  onPerformanceStudentFilterChange(studentId: string): void {
    this.selectedPerformanceStudentId = studentId || '';
    this.loadPerformance();
  }

  submitSubject(): void {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.savingSubject = true;
    const model: SubjectCreate = {
      moduleId: Number(this.subjectForm.value.moduleId),
      name: this.subjectForm.value.name?.trim() || '',
      description: this.subjectForm.value.description?.trim() || null,
      isActive: !!this.subjectForm.value.isActive
    };

    const request = this.editingSubjectId
      ? this.examService.updateSubject(this.editingSubjectId, model)
      : this.examService.createSubject(model);

    request.pipe(finalize(() => this.savingSubject = false)).subscribe({
      next: () => {
        this.resetSubjectForm();
        this.loadModules();
        this.loadSubjects();
        this.sharedService.showNotification(true, 'Subject saved', 'The subject has been saved successfully.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Save failed', error?.error?.message || 'Unable to save the subject.');
      }
    });
  }

  editSubject(subject: Subject): void {
    this.editingSubjectId = subject.id;
    this.subjectForm.patchValue({
      moduleId: subject.moduleId,
      name: subject.name,
      description: subject.description || '',
      isActive: subject.isActive
    });
  }

  deleteSubject(subject: Subject): void {
    if (!confirm(`Delete subject "${subject.name}"?`)) {
      return;
    }

    this.examService.deleteSubject(subject.id).subscribe({
      next: () => {
        if (this.selectedSubjectId === subject.id) {
          this.selectedSubjectId = 0;
        }
        this.loadModules();
        this.loadSubjects();
        this.loadQuestions();
        this.sharedService.showNotification(true, 'Subject deleted', 'The subject has been removed.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Delete failed', error?.error?.message || 'Unable to delete the subject.');
      }
    });
  }

  resetSubjectForm(): void {
    this.editingSubjectId = null;
    this.subjectForm.reset({
      moduleId: this.modules[0]?.id ?? null,
      name: '',
      description: '',
      isActive: true
    });
  }

  submitQuestion(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    this.savingQuestion = true;
    const editableTimeLimit = this.questionForm.value.timeLimitSeconds;
    const timeLimitMinutes = editableTimeLimit == null ? null : Number(editableTimeLimit);

    const model: QuestionCreate = {
      subjectId: Number(this.questionForm.value.subjectId),
      questionSetNumber: Number(this.questionForm.value.questionSetNumber) || 1,
      questionText: this.questionForm.value.questionText?.trim() || '',
      optionA: this.questionForm.value.optionA?.trim() || '',
      optionB: this.questionForm.value.optionB?.trim() || '',
      optionC: this.questionForm.value.optionC?.trim() || '',
      optionD: this.questionForm.value.optionD?.trim() || '',
      correctAnswer: this.questionForm.value.correctAnswer || 'A',
      explanation: this.questionForm.value.explanation?.trim() || null,
      defaultFeedback: this.questionForm.value.defaultFeedback?.trim() || null,
      score: Number(this.questionForm.value.score) || 1,
      timeLimitSeconds: timeLimitMinutes && timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null,
      isActive: !!this.questionForm.value.isActive
    };

    const request = this.editingQuestionId
      ? this.examService.updateQuestion(this.editingQuestionId, model)
      : this.examService.createQuestion(model);

    request.pipe(finalize(() => this.savingQuestion = false)).subscribe({
      next: () => {
        this.resetQuestionForm();
        this.loadQuestions();
        this.loadModules();
        this.loadSubjects();
        this.sharedService.showNotification(true, 'Question saved', 'The question has been saved successfully.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Save failed', error?.error?.message || 'Unable to save the question.');
      }
    });
  }

  editQuestion(question: Question): void {
    this.editingQuestionId = question.id;
    this.questionForm.patchValue({
      subjectId: question.subjectId,
      questionSetNumber: question.questionSetNumber,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      defaultFeedback: question.defaultFeedback || '',
      score: question.score,
      timeLimitSeconds: this.toEditableTimeLimit(question.timeLimitSeconds),
      isActive: question.isActive
    });
  }

  deleteQuestion(question: Question): void {
    if (!confirm('Delete this question?')) {
      return;
    }

    this.examService.deleteQuestion(question.id).subscribe({
      next: () => {
        this.loadQuestions();
        this.loadSubjects();
        this.sharedService.showNotification(true, 'Question deleted', 'The question has been removed.');
      },
      error: (error) => {
        this.sharedService.showNotification(false, 'Delete failed', error?.error?.message || 'Unable to delete the question.');
      }
    });
  }

  resetQuestionForm(): void {
    this.editingQuestionId = null;
    this.questionForm.reset({
      subjectId: this.availableSubjectsForSelection[0]?.id ?? this.subjects[0]?.id ?? null,
      questionSetNumber: 1,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      defaultFeedback: '',
      score: 1,
      timeLimitSeconds: null,
      isActive: true
    });
  }

  displayTimeLimit(timeLimitSeconds: number | null): string {
    if (!timeLimitSeconds) {
      return '';
    }

    const minutes = Math.floor(timeLimitSeconds / 60).toString();
    const seconds = (timeLimitSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get availableSubjectsForFilter(): Subject[] {
    if (!this.selectedModuleId) {
      return this.subjects;
    }

    return this.subjects.filter(subject => subject.moduleId === this.selectedModuleId);
  }

  get availableSubjectsForSelection(): Subject[] {
    return this.subjects;
  }

  get availablePerformanceSubjects(): Subject[] {
    if (!this.selectedPerformanceModuleId) {
      return this.subjects;
    }

    return this.subjects.filter(subject => subject.moduleId === this.selectedPerformanceModuleId);
  }

  private toEditableTimeLimit(timeLimitSeconds: number | null): number | null {
    if (!timeLimitSeconds) {
      return null;
    }

    if (timeLimitSeconds % 60 === 0) {
      return timeLimitSeconds / 60;
    }

    return timeLimitSeconds;
  }

  currentLevelExperience(user: User): number {
    return Math.max(0, user.experiencePoints - this.totalExperienceRequiredForLevel(user.level));
  }

  experienceNeededForNextLevel(user: User): number {
    return Math.max(100, user.level * 100);
  }

  experienceProgressPercent(user: User): number {
    return Math.min(100, (this.currentLevelExperience(user) / this.experienceNeededForNextLevel(user)) * 100);
  }

  levelBadge(level: number): string {
    return getLevelBadgeAsset(level);
  }

  private totalExperienceRequiredForLevel(level: number): number {
    if (level <= 1) {
      return 0;
    }

    return ((level - 1) * level / 2) * 100;
  }
}
