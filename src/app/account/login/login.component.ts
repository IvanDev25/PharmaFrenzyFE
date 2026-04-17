import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { User } from 'src/app/shared/models/account/user';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit{
  private readonly studentWelcomeStorageKey = 'show-student-home-welcome';
  loginForm : FormGroup = new FormGroup({});
  submitted = false;
  errorMessages: string[] = [];
  returnUrl: string | null = null;

  constructor(private accountService:AccountService,
    private formBuilder:FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
      this.accountService.user$.pipe(take(1)).subscribe ({
        next: (user:User | null) => {
          if (user) {
            this.router.navigateByUrl('/');
          } else {
            this.activatedRoute.queryParamMap.subscribe({
              next: (params: any) =>{
                if (params) {
                  this.returnUrl = params.get('returnUrl');
                }
              }
            })
          }
        }
      })
  }
  ngOnInit(): void {
    this. initializeForm();
  }

  initializeForm(){
    this.loginForm = this.formBuilder.group({
      userName: ['', Validators.required],
      password: ['',  Validators.required],
    })
      }

      login() {
        this.submitted = true;
        this.errorMessages = [];

        if (this.loginForm.valid) {
          this.accountService.login(this.loginForm.value).subscribe({
            next: (response: User | null) => {
              if (response?.role === 'Student') {
                sessionStorage.setItem(this.studentWelcomeStorageKey, 'true');
              }

              this.finishLoginNavigation(response);
            },
            error: error => {
              if (error.error.errors) {
                this.errorMessages = error.error.errors;
              } else {
                this.errorMessages.push(error.error);
              }
            }
          })

      }
  } 

  private finishLoginNavigation(response: User | null): void {
    if (this.returnUrl) {
      const jwt = response?.jwt ?? this.accountService.getJWT();
      if (this.returnUrl.startsWith('http://') || this.returnUrl.startsWith('https://')) {
        const separator = this.returnUrl.includes('?') ? '&' : '?';
        const targetUrl = jwt
          ? `${this.returnUrl}${separator}swaggerToken=${encodeURIComponent(jwt)}`
          : this.returnUrl;
        window.location.href = targetUrl;
        return;
      }

      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.router.navigateByUrl(response?.role === 'Student' ? '/exams' : '/');
  }

  resendEmailConfirmationLink(){
    this.router.navigateByUrl('account/send-email/resend-email-confirmation-link');
  }
}
