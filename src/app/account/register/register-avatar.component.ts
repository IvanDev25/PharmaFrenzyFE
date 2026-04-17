import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Register } from 'src/app/shared/models/account/register';
import { User } from 'src/app/shared/models/account/user';
import { AccountService, PendingRegistration } from '../account.service';

@Component({
  selector: 'app-register-avatar',
  templateUrl: './register-avatar.component.html',
  styleUrls: ['./register-avatar.component.scss']
})
export class RegisterAvatarComponent implements OnInit {
  readonly avatarOptions = Array.from({ length: 9 }, (_, index) => `assets/${index + 1}.png`);
  selectedAvatar = this.avatarOptions[0];
  creating = false;
  errorMessages: string[] = [];
  pendingRegistration: PendingRegistration | null = null;

  constructor(
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pendingRegistration = this.accountService.getPendingRegistration();
    if (!this.pendingRegistration?.verificationToken || !this.pendingRegistration.firstName || !this.pendingRegistration.lastName || !this.pendingRegistration.password || !this.pendingRegistration.gender || !this.pendingRegistration.university) {
      this.router.navigateByUrl('/account/register');
    }
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
  }

  goBack(): void {
    this.router.navigateByUrl('/account/register');
  }

  createAccount(): void {
    if (!this.pendingRegistration || this.creating) {
      return;
    }

    const pendingRegistration = this.pendingRegistration;
    this.creating = true;
    this.errorMessages = [];

    const model: Register = {
      firstName: pendingRegistration.firstName!,
      lastName: pendingRegistration.lastName!,
      email: pendingRegistration.email,
      phoneNumber: pendingRegistration.phoneNumber ?? '',
      university: pendingRegistration.university!,
      gender: pendingRegistration.gender!,
      password: pendingRegistration.password!,
      image: this.selectedAvatar,
      verificationToken: pendingRegistration.verificationToken
    };

    this.accountService.register(model).subscribe({
      next: (user: User | null) => {
        this.creating = false;
        this.accountService.clearPendingRegistration();
        if (user) {
          this.router.navigateByUrl('/');
        }
      },
      error: error => {
        this.creating = false;
        if (error.error?.errors) {
          this.errorMessages = error.error.errors;
        } else if (error.error?.message) {
          this.errorMessages = [error.error.message];
        } else if (typeof error.error === 'string') {
          this.errorMessages = [error.error];
        } else {
          this.errorMessages = ['Unable to create your account right now.'];
        }
      }
    });
  }
}
