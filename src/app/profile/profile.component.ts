import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { AvatarPickerDialogComponent } from '../account/register/avatar-picker-dialog.component';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { UpdateProfile } from '../shared/models/account/update-profile';
import { RankingBadge } from '../shared/models/account/ranking-badge';
import { User } from '../shared/models/account/user';
import { getLevelBadgeAsset } from '../shared/utils/level-badge.util';

@Component({
  selector: 'app-profile',
  template: `
    <section class="profile-shell" *ngIf="user$ | async as user">
      <section class="page-navbar">
        <app-navbar [forceShow]="true"></app-navbar>
      </section>

      <div class="profile-page">
        <div class="profile-card">
        <form [formGroup]="profileForm" class="profile-form">
          <div class="profile-layout">
            <div class="profile-layout__main">
              <div class="avatar-editor avatar-editor--hero">
                <div class="avatar-editor__preview">
                  <img [src]="profileForm.value.image || user.image || 'assets/1.png'" [alt]="user.firstName + ' avatar preview'" />
                  <div>
                    <span class="avatar-editor__label">{{ user.role || 'User' }}</span>
                    <p>{{ user.firstName | titlecase }} {{ user.lastName | titlecase }}</p>
                  </div>
                </div>

                <button
                  *ngIf="isStudent"
                  type="button"
                  class="profile-level-badge-button"
                  title="Show ranking list"
                  aria-label="Show ranking list"
                  (click)="showRankingList = true">
                  <img
                    class="profile-level-badge"
                    [src]="levelBadge(user.level)"
                    [alt]="'Level ' + user.level + ' badge'" />
                  <span class="profile-level-badge-button__hint">?</span>
                </button>
              </div>

              <section class="progress-overview" *ngIf="isStudent">
                <div class="progress-overview__header">
                  <div>
                    <span class="progress-overview__eyebrow">Overall Progress</span>
                    <h2>Your exam completion</h2>
                  </div>
                  <span class="progress-overview__status" *ngIf="progressLoading">Loading...</span>
                </div>

                <div class="progress-overview__content">
                  <div class="progress-overview__chart" [style.--progress]="overallProgress.percentage" aria-hidden="true">
                    <div class="progress-overview__chart-inner">
                      <span class="progress-overview__chart-number">{{ overallProgress.percentage }}%</span>
                    </div>
                  </div>

                  <div class="progress-overview__stats">
                    <div class="detail-item">
                      <span class="detail-label">Completed Sets</span>
                      <span class="detail-value">{{ overallProgress.completedSets }} / {{ overallProgress.totalSets }}</span>
                    </div>

                    <div class="detail-item">
                      <span class="detail-label">Completed Modules</span>
                      <span class="detail-value">{{ overallProgress.completedModules }} / {{ overallProgress.totalModules }}</span>
                    </div>

                    <div class="detail-item">
                      <span class="detail-label">Submitted Exams</span>
                      <span class="detail-value">{{ overallProgress.submittedAttempts }}</span>
                    </div>
                  </div>
                </div>

                <p class="progress-overview__note">
                  {{ overallProgress.completedSets }} of {{ overallProgress.totalSets }} active set{{ overallProgress.totalSets !== 1 ? 's' : '' }} perfected across all modules.
                </p>
              </section>

              <div class="avatar-editor">
                <div class="avatar-editor__preview">
                  <img [src]="profileForm.value.image || user.image || 'assets/1.png'" [alt]="user.firstName + ' avatar preview'" />
                  <div>
                    <span class="avatar-editor__label">Profile Avatar</span>
                    <p>Choose the avatar that should appear in your profile and rankings.</p>
                  </div>
                </div>

                <button mat-stroked-button color="primary" type="button" (click)="openAvatarModal()">
                  Change Avatar
                </button>
              </div>

              <div class="details-grid">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Phone Number</mat-label>
                  <input matInput formControlName="phoneNumber" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>University</mat-label>
                  <input matInput formControlName="university" />
                </mat-form-field>
              </div>
            </div>

            <aside class="profile-layout__side" *ngIf="isStudent">
              <section class="profile-stats-panel">
                <div class="profile-mini-stat">
                  <span class="detail-label">Total Points</span>
                  <span class="detail-value">{{ user.totalPoints | number: '1.1-2' }}</span>
                </div>
              </section>

              <section class="ranking-badges">
                <div class="ranking-badges__header">
                  <div>
                    <span class="progress-overview__eyebrow">Achievement Badges</span>
                    <h2>Ranking rewards</h2>
                  </div>
                </div>

                <div class="ranking-badges__empty" *ngIf="!user.rankingBadges?.length">
                  Finish in the top 1, 2, or 3 of a weekly module board or monthly global board to earn badges here.
                </div>

                <div class="ranking-badges__grid" *ngIf="user.rankingBadges?.length">
                  <div class="ranking-badge-card" *ngFor="let badge of user.rankingBadges">
                    <div class="ranking-badge-card__visual">
                      <img
                        class="ranking-badge-card__image"
                        [src]="rankingBadgeAsset(badge)"
                        [alt]="rankingBadgeLabel(badge)" />
                    </div>
                    <div class="ranking-badge-card__body">
                      <span class="ranking-badge-card__scope">{{ rankingBadgeLabel(badge) }}</span>
                      <span class="ranking-badge-card__module" *ngIf="badge.scope === 'Module'">{{ badge.moduleName || 'Module' }}</span>
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div class="profile-actions">
            <button mat-flat-button color="primary" type="button" [disabled]="saving" (click)="saveProfile()">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
        </div>

      </div>

      <div class="ranking-list-modal" *ngIf="showRankingList" (click)="showRankingList = false">
        <div class="ranking-list-modal__dialog" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="ranking-list-modal__close"
            aria-label="Close ranking list"
            (click)="showRankingList = false">
            x
          </button>
          <span class="ranking-list-modal__eyebrow">Ranking List</span>
          <img class="ranking-list-modal__image" src="assets/Rank List/RANKING.png" alt="Ranking list" />
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  saving = false;
  progressLoading = false;
  isStudent = false;
  showRankingList = false;
  overallProgress = {
    completedSets: 0,
    totalSets: 0,
    completedModules: 0,
    totalModules: 0,
    submittedAttempts: 0,
    percentage: 0
  };
  private readonly destroy$ = new Subject<void>();

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.maxLength(30)],
    university: ['', Validators.maxLength(150)],
    image: ['assets/1.png', Validators.required]
  });

  readonly avatarOptions = Array.from({ length: 9 }, (_, index) => `assets/${index + 1}.png`);

  constructor(
    private accountService: AccountService,
    private examService: ExamService,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.user$ = this.accountService.user$;
  }

  ngOnInit(): void {
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.isStudent = false;
          this.resetOverallProgress();
          return;
        }

        this.isStudent = user.role === 'Student';

        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          university: user.university || '',
          image: user.image || this.avatarOptions[0]
        }, { emitEvent: false });

        if (this.isStudent) {
          this.loadOverallProgress();
        } else {
          this.resetOverallProgress();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(user: User): string {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  levelBadge(level: number): string {
    return getLevelBadgeAsset(level);
  }

  rankingBadgeAsset(badge: RankingBadge): string {
    if (badge.scope === 'Module') {
      switch (badge.rank) {
        case 1:
          return 'assets/Module_Rank1.png';
        case 2:
          return 'assets/Module_Rank2.png';
        case 3:
          return 'assets/Module_Rank3.png';
        default:
          return 'assets/Module_Rank3.png';
      }
    }

    switch (badge.rank) {
      case 1:
        return 'assets/Globals_Rank1.png';
      case 2:
        return 'assets/Globals_Rank2.png';
      case 3:
        return 'assets/Globals_Rank3.png';
      default:
        return 'assets/Globals_Rank3.png';
    }
  }

  rankingBadgeLabel(badge: RankingBadge): string {
    return badge.scope === 'Module'
      ? `Module Badge (${badge.count})`
      : `Global Badge (${badge.count})`;
  }

  currentLevelExperience(user: User): number {
    return user.experiencePoints - this.totalExperienceRequiredForLevel(user.level);
  }

  experienceNeededForNextLevel(user: User): number {
    return user.level * 100;
  }

  totalExperienceForNextLevel(user: User): number {
    return this.totalExperienceRequiredForLevel(user.level + 1);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const model: UpdateProfile = {
      firstName: this.profileForm.value.firstName?.trim() || '',
      lastName: this.profileForm.value.lastName?.trim() || '',
      email: this.profileForm.value.email?.trim() || '',
      phoneNumber: this.profileForm.value.phoneNumber?.trim() || null,
      university: this.profileForm.value.university?.trim() || null,
      image: this.profileForm.value.image || this.avatarOptions[0]
    };

    this.saving = true;
    this.accountService.updateProfile(model)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.sharedService.showNotification(true, 'Profile updated', 'Your information has been updated successfully.');
        },
        error: (error) => {
          this.sharedService.showNotification(false, 'Update failed', error?.error?.message || 'Unable to update your profile.');
        }
      });
  }

  openAvatarModal(): void {
    const dialogRef = this.dialog.open(AvatarPickerDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'avatar-picker-modal',
      data: {
        avatars: this.avatarOptions,
        selectedAvatar: this.profileForm.get('image')?.value || this.avatarOptions[0]
      }
    });

    dialogRef.afterClosed().subscribe((selectedAvatar: string | undefined) => {
      if (!selectedAvatar) {
        return;
      }

      this.profileForm.patchValue({ image: selectedAvatar });
      this.profileForm.get('image')?.markAsTouched();
    });
  }

  private loadOverallProgress(): void {
    this.progressLoading = true;

    let activeRequests = 3;
    let modulesCounted = false;
    let subjectsCounted = false;
    let attemptsCounted = false;

    const finishLoading = () => {
      activeRequests--;
      if (activeRequests <= 0) {
        this.progressLoading = false;
      }
    };

    const recalculateProgress = (
      modules: { id: number; isActive: boolean }[] | null,
      subjects: { id: number; moduleId: number; isActive: boolean; questionSets: { questionSetNumber: number }[] }[] | null,
      attempts: { moduleId: number; subjectId: number; questionSetNumber: number; status: string; totalScore: number; totalPossibleScore: number }[] | null
    ) => {
      if (!modules || !subjects || !attempts) {
        return;
      }

      const activeModules = modules.filter(module => module.isActive);
      const activeSubjects = subjects.filter(subject => subject.isActive);
      const activeModuleIds = new Set(activeModules.map(module => module.id));
      const activeSetKeys = new Set(
        activeSubjects.flatMap(subject =>
          (subject.questionSets ?? []).map(questionSet => `${subject.id}:${questionSet.questionSetNumber}`))
      );

      const completedSetKeys = new Set(
        attempts
          .filter(attempt =>
            attempt.status === 'Submitted' &&
            attempt.totalPossibleScore > 0 &&
            attempt.totalScore >= attempt.totalPossibleScore &&
            activeModuleIds.has(attempt.moduleId) &&
            activeSetKeys.has(`${attempt.subjectId}:${attempt.questionSetNumber}`))
          .map(attempt => `${attempt.subjectId}:${attempt.questionSetNumber}`)
      );

      const completedModuleIds = new Set(
        activeModules
          .filter(module => {
            const moduleSetKeys = activeSubjects
              .filter(subject => subject.moduleId === module.id)
              .flatMap(subject => (subject.questionSets ?? []).map(questionSet => `${subject.id}:${questionSet.questionSetNumber}`));

            return moduleSetKeys.length > 0 && moduleSetKeys.every(setKey => completedSetKeys.has(setKey));
          })
          .map(module => module.id)
      );

      const submittedAttempts = attempts.filter(attempt => attempt.status === 'Submitted').length;

      this.overallProgress = {
        completedSets: completedSetKeys.size,
        totalSets: activeSetKeys.size,
        completedModules: completedModuleIds.size,
        totalModules: activeModules.length,
        submittedAttempts,
        percentage: activeSetKeys.size > 0 ? Math.round((completedSetKeys.size / activeSetKeys.size) * 100) : 0
      };
    };

    let modulesData: { id: number; isActive: boolean }[] | null = null;
    let subjectsData: { id: number; moduleId: number; isActive: boolean; questionSets: { questionSetNumber: number }[] }[] | null = null;
    let attemptsData: { moduleId: number; subjectId: number; questionSetNumber: number; status: string; totalScore: number; totalPossibleScore: number }[] | null = null;

    this.examService.getModules()
      .pipe(takeUntil(this.destroy$), finalize(() => finishLoading()))
      .subscribe({
        next: modules => {
          modulesData = modules;
          modulesCounted = true;
          recalculateProgress(modulesData, subjectsData, attemptsData);
        },
        error: () => {
          if (!modulesCounted) {
            this.resetOverallProgress();
          }
        }
      });

    this.examService.getSubjects()
      .pipe(takeUntil(this.destroy$), finalize(() => finishLoading()))
      .subscribe({
        next: subjects => {
          subjectsData = subjects;
          subjectsCounted = true;
          recalculateProgress(modulesData, subjectsData, attemptsData);
        },
        error: () => {
          if (!subjectsCounted) {
            this.resetOverallProgress();
          }
        }
      });

    this.examService.getMyAttempts()
      .pipe(takeUntil(this.destroy$), finalize(() => finishLoading()))
      .subscribe({
        next: attempts => {
          attemptsData = attempts;
          attemptsCounted = true;
          recalculateProgress(modulesData, subjectsData, attemptsData);
        },
        error: () => {
          if (!attemptsCounted) {
            this.resetOverallProgress();
          }
        }
      });
  }

  private resetOverallProgress(): void {
    this.progressLoading = false;
    this.overallProgress = {
      completedSets: 0,
      totalSets: 0,
      completedModules: 0,
      totalModules: 0,
      submittedAttempts: 0,
      percentage: 0
    };
  }

  private totalExperienceRequiredForLevel(level: number): number {
    if (level <= 1) {
      return 0;
    }

    return ((level - 1) * level / 2) * 100;
  }
}
