import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AccountService } from 'src/app/account/account.service';
import { User } from '../models/account/user';
import { SharedService } from '../shared.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard  {
  constructor(private accountService:AccountService,
    private sharedService: SharedService,
    private router: Router) {
    
  }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    return this.accountService.user$.pipe(
      map((user: User | null) => {
        if (user) {
          const allowedRoles = route.data['roles'] as string[] | undefined;
          if (allowedRoles?.length && (!user.role || !allowedRoles.includes(user.role))) {
            this.sharedService.showNotification(false, 'Restricted Area', 'You do not have permission to view this page.');
            this.router.navigateByUrl('/');
            return false;
          }
          return true;
        }else {
          this.sharedService.showNotification(false, 'Restricted Area', 'Leave immediately');
          this.router.navigate(['account/login'], {queryParams: {returnUrl: state.url}});
          return false;
        }
      })
    );
  }
  
}
