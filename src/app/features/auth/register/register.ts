import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  showPass = false;
  showConfirm = false;
  isLoading = false;
  errorMsg = '';
  successMsg = '';

  strengthWidth = '0%';
  strengthColor = '#e0e0e0';
  strengthLabel = 'Enter a password';

  registerForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.registerForm = new FormGroup(
      {
        firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
        lastName: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        role: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirmPassword: new FormControl('', [Validators.required]),
        agreed: new FormControl(false, [Validators.requiredTrue]),
      },
      { validators: this.passwordMatchValidator },
    );

    this.registerForm.get('password')?.valueChanges.subscribe((val) => {
      this.checkStrength(val);
    });
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const pass = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    if (pass && confirm && pass !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  get passwordMismatch() {
    return (
      this.registerForm.errors?.['passwordMismatch'] && this.f['confirmPassword'].touched
    );
  }

  checkStrength(val: string) {
    let score = 0;
    if (val?.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const map = [
      { w: '0%', c: '#e0e0e0', t: 'Enter a password' },
      { w: '25%', c: '#E24B4A', t: 'Weak' },
      { w: '50%', c: '#EF9F27', t: 'Fair' },
      { w: '75%', c: '#639922', t: 'Good' },
      { w: '100%', c: '#1D9E75', t: 'Strong' },
    ];

    this.strengthWidth = map[score].w;
    this.strengthColor = map[score].c;
    this.strengthLabel = map[score].t;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const { firstName, lastName, email, password, role } = this.registerForm.value;
    const req: RegisterRequest = {
      firstName,
      lastName,
      email,
      password,
      role,
    };

    this.authService.register(req).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg =
          'Registration successful! Please check your email to confirm your account.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.errorMsg = AuthService.registerErrorMessage(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
