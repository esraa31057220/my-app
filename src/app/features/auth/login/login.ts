import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../models';
import { readApiErrorMessage } from '../../../utils/api-error.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
})
export class LoginComponent implements OnInit {
  errorMsg = '';
  showPass = false;
  loginForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMsg = '';

    const req: LoginRequest = this.loginForm.value;

    this.authService.login(req).subscribe({
      next: (res) => {
        if (!res.token) {
          this.errorMsg = 'Login failed: no token received.';
          this.cdr.detectChanges();
          return;
        }
        this.authService.saveSession(res);
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.errorMsg = this.toErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private toErrorMessage(err: unknown): string {
    const fromBody = readApiErrorMessage(err);
    if (fromBody) return fromBody;
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 400) {
        return 'Invalid email or password. Please try again.';
      }
    }
    return 'Login failed. Please try again.';
  }
}
