import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AccountService } from '../account/account.service';
import { User } from '../shared/models/account/user';
import { getLevelBadgeAsset } from '../shared/utils/level-badge.util';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() forceShow = false;
  hideNavbar = false;
  activeDropdown: 'user' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateNavbarVisibility());

    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateNavbarVisibility();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.activeDropdown = null;
    this.accountService.logout();
  }

  goToAdmin(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/Admin');
  }

  goToExams(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/exams');
  }

  goToHistory(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/exams/history');
  }

  goToRanking(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/rankings');
  }

  goToWallet(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/wallet');
  }

  toggleDropdown(type: 'user'): void {
    this.activeDropdown = this.activeDropdown === type ? null : type;
  }

  goToProfile(): void {
    this.activeDropdown = null;
    this.router.navigateByUrl('/profile');
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  hasRole(role: string | null | undefined, expected: string): boolean {
    return role === expected;
  }

  levelBadge(level: number): string {
    return getLevelBadgeAsset(level);
  }

  currentLevelExperience(user: User): number {
    return Math.max(0, user.experiencePoints - this.totalExperienceRequiredForLevel(user.level));
  }

  experienceNeededForNextLevel(user: User): number {
    return Math.max(100, user.level * 100);
  }

  totalExperienceForNextLevel(user: User): number {
    return this.totalExperienceRequiredForLevel(user.level + 1);
  }

  experienceProgressPercent(user: User): number {
    return Math.min(100, (this.currentLevelExperience(user) / this.experienceNeededForNextLevel(user)) * 100);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile')) {
      this.activeDropdown = null;
    }
  }

  private updateNavbarVisibility(): void {
    if (this.forceShow) {
      this.hideNavbar = false;
      return;
    }

    const url = this.router.url;
    const hideOnRoutes = [
      '/exams',
      '/exams/history',
      '/exams/attempt',
      '/rankings',
      '/wallet',
      '/profile',
      '/account/login',
      '/account/register',
      '/account/confirm-email',
      '/account/send-email',
      '/account/reset-password'
    ];

    const shouldHideForRoute = hideOnRoutes.some(route => url.startsWith(route));
    const rawUser = localStorage.getItem('identityAppUser');
    const hasUser = !!rawUser;

    this.hideNavbar = shouldHideForRoute || (url === '/' && !hasUser);
  }

  private totalExperienceRequiredForLevel(level: number): number {
    if (level <= 1) {
      return 0;
    }

    return ((level - 1) * level / 2) * 100;
  }
}
