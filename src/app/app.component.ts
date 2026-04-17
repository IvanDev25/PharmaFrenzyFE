import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AccountService } from './account/account.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoading = true;

  constructor(
    private accountService: AccountService
  ) {
    
  }

  ngOnInit(): void {
    this.refreshUser();
  }

  private refreshUser() {
    const jwt = this.accountService.getJWT();
    if (jwt) {
      this.accountService.refreshUser(jwt)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: _ => {},
          error: _ => {
            this.accountService.logout();
          }
        });
    } else {
      this.accountService.refreshUser(null)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe();
    }
  }

  title = 'Ivan Identity';
}
 
