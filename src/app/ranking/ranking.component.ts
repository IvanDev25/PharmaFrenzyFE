import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { User } from '../shared/models/account/user';
import { Module } from '../shared/models/exam/module';
import { RankingBoard } from '../shared/models/exam/ranking';
import { getLevelBadgeAsset } from '../shared/utils/level-badge.util';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  modules: Module[] = [];
  selectedModuleId: number | null = null;

  globalRanking: RankingBoard | null = null;
  moduleRanking: RankingBoard | null = null;

  loadingGlobal = false;
  loadingModules = false;
  loadingModuleRanking = false;
  now = new Date();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private examService: ExamService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.now = new Date();
      });

    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadGlobalRanking();
    this.loadModules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGlobalRanking(): void {
    this.loadingGlobal = true;
    this.examService.getGlobalRanking()
      .pipe(finalize(() => this.loadingGlobal = false))
      .subscribe({
        next: ranking => {
          this.globalRanking = ranking;
        },
        error: () => {
          this.globalRanking = null;
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load the global ranking.');
        }
      });
  }

  loadModules(): void {
    this.loadingModules = true;
    this.examService.getModules()
      .pipe(finalize(() => this.loadingModules = false))
      .subscribe({
        next: modules => {
          this.modules = modules.filter(module => module.isActive);
          this.selectedModuleId = this.modules[0]?.id ?? null;

          if (this.selectedModuleId) {
            this.loadModuleRanking(this.selectedModuleId);
          }
        },
        error: () => {
          this.modules = [];
          this.selectedModuleId = null;
          this.moduleRanking = null;
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load modules for ranking.');
        }
      });
  }

  onModuleChange(moduleId: number | null): void {
    this.selectedModuleId = moduleId;
    if (!moduleId) {
      this.moduleRanking = null;
      return;
    }

    this.loadModuleRanking(moduleId);
  }

  trackByStudent(_: number, entry: { studentId: string }): string {
    return entry.studentId;
  }

  globalRankBadge(rank: number): string | null {
    switch (rank) {
      case 1:
        return 'assets/Globals_Rank1.png';
      case 2:
        return 'assets/Globals_Rank2.png';
      case 3:
        return 'assets/Globals_Rank3.png';
      default:
        return null;
    }
  }

  moduleRankBadge(rank: number): string | null {
    switch (rank) {
      case 1:
        return 'assets/Module_Rank1.png';
      case 2:
        return 'assets/Module_Rank2.png';
      case 3:
        return 'assets/Module_Rank3.png';
      default:
        return null;
    }
  }

  levelBadge(level: number): string {
    return getLevelBadgeAsset(level);
  }

  countdownText(board: RankingBoard | null): string {
    if (!board?.resetAtUtc) {
      return '--';
    }

    const remainingMs = new Date(board.resetAtUtc).getTime() - this.now.getTime();
    if (remainingMs <= 0) {
      return 'Resetting now';
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const dayPart = days > 0 ? `${days}d ` : '';
    return `${dayPart}${this.padTime(hours)}:${this.padTime(minutes)}:${this.padTime(seconds)}`;
  }

  resetDateText(board: RankingBoard | null): string {
    if (!board?.resetAtUtc) {
      return '--';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(board.resetAtUtc));
  }

  periodPointsLabel(board: RankingBoard | null): string {
    return board?.scope === 'Module' ? 'My Weekly Module Points' : 'My Monthly Points';
  }

  private loadModuleRanking(moduleId: number): void {
    this.loadingModuleRanking = true;
    this.examService.getModuleRanking(moduleId)
      .pipe(finalize(() => this.loadingModuleRanking = false))
      .subscribe({
        next: ranking => {
          this.moduleRanking = ranking;
        },
        error: () => {
          this.moduleRanking = null;
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load the module ranking.');
        }
      });
  }

  private padTime(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
