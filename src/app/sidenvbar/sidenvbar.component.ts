import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { sideNavData } from './sidemenu-data';
import { filter, switchMap, tap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AccountService } from '../account/account.service';

@Component({
  selector: 'app-sidenvbar',
  templateUrl: './sidenvbar.component.html',
  styleUrls: ['./sidenvbar.component.scss']
})
export class SidenvbarComponent implements OnInit, OnDestroy {

  collapsed = false;
  navData = sideNavData;
  filteredNavData = sideNavData;
  expandedItem: any = null;
  hideNavbar: boolean = false;
  isAdmin: boolean = false;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private router: Router,
    public accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      switchMap(() => this.accountService.user$),
      tap(user => {
        const url = this.router.url;
        const hideOnRoutes = [
          '/account/login',
          '/account/register',
          '/account/confirm-email',
          '/account/send-email',
          '/account/reset-password'
        ];
        const shouldHideForRoute = hideOnRoutes.some(route => url.startsWith(route));
        this.hideNavbar = shouldHideForRoute || (url === '/' && !user);
        this.isAdmin = user?.role === 'Admin';
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe();
    this.filteredNavData = this.navData;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.expandedItem = null;
    }
  }

  toggleOpen(): void {
    this.collapsed = false;
  }

  toggleSubMenu(nav: any): void {
    if (this.collapsed && nav.subItem) {
      this.collapsed = false;
    }
    this.expandedItem = this.expandedItem === nav ? null : nav;
  }
}
