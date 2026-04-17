import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { User } from 'src/app/shared/models/account/user';
import { AccountService, PendingRegistration } from '../account.service';

type RegisterStep = 'email' | 'otp' | 'details';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  readonly genderOptions = ['Male', 'Female', 'Other'];

  emailForm: FormGroup = new FormGroup({});
  otpForm: FormGroup = new FormGroup({});
  detailsForm: FormGroup = new FormGroup({});

  currentStep: RegisterStep = 'email';
  submittedEmail = false;
  submittedOtp = false;
  submittedDetails = false;
  sendingOtp = false;
  verifyingOtp = false;
  resendingOtp = false;
  errorMessages: string[] = [];
  infoMessage = '';

  passwordStrengthText = 'Password strength';
  passwordStrengthClass = '';

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.accountService.user$.pipe(take(1)).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigateByUrl('/');
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.restorePendingRegistration();
  }

  sendOtp(): void {
    this.submittedEmail = true;
    this.errorMessages = [];
    this.infoMessage = '';

    if (this.emailForm.invalid || this.sendingOtp) {
      return;
    }

    this.sendingOtp = true;
    const email = this.emailForm.get('email')?.value?.trim();

    this.accountService.sendRegistrationOtp({ email }).subscribe({
      next: () => {
        this.sendingOtp = false;
        this.submittedOtp = false;
        this.otpForm.reset();
        this.syncPendingRegistration({ email, verificationToken: '' });
        this.patchDetailsEmail(email);
        this.currentStep = 'otp';
        this.infoMessage = 'We sent a 6-digit OTP to your email.';
      },
      error: error => {
        this.sendingOtp = false;
        this.errorMessages = this.extractErrors(error);
      }
    });
  }

  verifyOtp(): void {
    this.submittedOtp = true;
    this.errorMessages = [];
    this.infoMessage = '';

    if (this.otpForm.invalid || this.verifyingOtp) {
      return;
    }

    const email = this.emailForm.get('email')?.value?.trim();
    const otp = this.otpForm.get('otp')?.value?.trim();

    this.verifyingOtp = true;
    this.accountService.verifyRegistrationOtp({ email, otp }).subscribe({
      next: response => {
        this.verifyingOtp = false;
        this.currentStep = 'details';
        this.patchDetailsEmail(email);
        this.syncPendingRegistration({
          ...this.accountService.getPendingRegistration(),
          email,
          verificationToken: response.verificationToken
        });
        this.infoMessage = 'Email verified. Fill in the rest of your account details.';
      },
      error: error => {
        this.verifyingOtp = false;
        this.errorMessages = this.extractErrors(error);
      }
    });
  }

  resendOtp(): void {
    if (this.resendingOtp || this.sendingOtp) {
      return;
    }

    this.errorMessages = [];
    this.infoMessage = '';
    this.resendingOtp = true;

    const email = this.emailForm.get('email')?.value?.trim();
    this.accountService.sendRegistrationOtp({ email }).subscribe({
      next: () => {
        this.resendingOtp = false;
        this.otpForm.reset();
        this.syncPendingRegistration({ email, verificationToken: '' });
        this.infoMessage = 'A new OTP has been sent to your email.';
      },
      error: error => {
        this.resendingOtp = false;
        this.errorMessages = this.extractErrors(error);
      }
    });
  }

  goBackToEmail(): void {
    this.currentStep = 'email';
    this.submittedOtp = false;
    this.errorMessages = [];
    this.infoMessage = '';
    this.syncPendingRegistration(null);
  }

  continueToAvatar(): void {
    this.submittedDetails = true;
    this.errorMessages = [];
    this.infoMessage = '';

    if (this.detailsForm.invalid) {
      return;
    }

    const rawValue = this.detailsForm.getRawValue();
    const gender = rawValue.gender === 'Other' ? rawValue.customGender?.trim() : rawValue.gender;
    const pendingRegistration = this.accountService.getPendingRegistration();

    if (!pendingRegistration?.verificationToken) {
      this.errorMessages = ['Please verify your email first.'];
      this.currentStep = 'email';
      return;
    }

    this.accountService.setPendingRegistration({
      email: rawValue.email.trim(),
      verificationToken: pendingRegistration.verificationToken,
      firstName: rawValue.firstName.trim(),
      lastName: rawValue.lastName.trim(),
      phoneNumber: rawValue.phoneNumber?.trim() ?? '',
      university: rawValue.university.trim(),
      gender: gender?.trim(),
      password: rawValue.password
    });

    this.router.navigateByUrl('/account/register/avatar');
  }

  getField(controlName: string): AbstractControl | null {
    return this.detailsForm.get(controlName);
  }

  private initializeForms(): void {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.detailsForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phoneNumber: [''],
      university: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      gender: ['', Validators.required],
      customGender: [''],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]]
    });

    this.detailsForm.get('password')?.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password);
    });

    this.detailsForm.get('gender')?.valueChanges.subscribe(selectedGender => {
      const customGenderControl = this.detailsForm.get('customGender');

      if (selectedGender === 'Other') {
        customGenderControl?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
      } else {
        customGenderControl?.clearValidators();
        customGenderControl?.setValue('', { emitEvent: false });
      }

      customGenderControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private restorePendingRegistration(): void {
    const pendingRegistration = this.accountService.getPendingRegistration();
    if (!pendingRegistration?.email) {
      return;
    }

    this.emailForm.patchValue({ email: pendingRegistration.email });
    this.patchDetailsEmail(pendingRegistration.email);

    if (pendingRegistration.verificationToken) {
      this.currentStep = 'details';
      const savedGender = pendingRegistration.gender ?? '';
      const selectedGender = this.genderOptions.includes(savedGender) ? savedGender : savedGender ? 'Other' : '';

      this.detailsForm.patchValue({
        firstName: pendingRegistration.firstName ?? '',
        lastName: pendingRegistration.lastName ?? '',
        phoneNumber: pendingRegistration.phoneNumber ?? '',
        university: pendingRegistration.university ?? '',
        gender: selectedGender,
        customGender: selectedGender === 'Other' ? savedGender : '',
        password: pendingRegistration.password ?? ''
      });

      this.checkPasswordStrength(pendingRegistration.password ?? '');
      return;
    }

    this.currentStep = 'otp';
  }

  private patchDetailsEmail(email: string): void {
    this.detailsForm.get('email')?.setValue(email);
  }

  private syncPendingRegistration(model: PendingRegistration | null): void {
    if (!model) {
      this.accountService.clearPendingRegistration();
      return;
    }

    this.accountService.setPendingRegistration(model);
  }

  private extractErrors(error: any): string[] {
    if (error.error?.errors) {
      return error.error.errors;
    }

    if (error.error?.message) {
      return [error.error.message];
    }

    if (typeof error.error === 'string') {
      return [error.error];
    }

    return ['Something went wrong. Please try again.'];
  }

  private checkPasswordStrength(password: string): void {
    let strength = 0;

    if (!password) {
      this.passwordStrengthText = 'Password strength';
      this.passwordStrengthClass = '';
      return;
    }

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        this.passwordStrengthClass = 'weak';
        this.passwordStrengthText = 'Weak password';
        break;
      case 2:
        this.passwordStrengthClass = 'fair';
        this.passwordStrengthText = 'Fair password';
        break;
      case 3:
      case 4:
        this.passwordStrengthClass = 'good';
        this.passwordStrengthText = 'Good password';
        break;
      case 5:
        this.passwordStrengthClass = 'strong';
        this.passwordStrengthText = 'Strong password';
        break;
    }
  }
}
