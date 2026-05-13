import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/user.service';
import { IUser } from '../../models/iuser';
import { AdminLocalPolicyService } from '../services/admin-local-policy.service';
import { AdminDataTableComponent } from '../shared/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDataTableComponent],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css', '../../features/profile/users/users.css'],
})
export class AdminUsers implements OnInit {
  private usersService = inject(UsersService);
  private policy = inject(AdminLocalPolicyService);

  rawUsers = signal<IUser[]>([]);
  showDeleted = signal(false);
  loading = signal(false);

  formUser: IUser = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'Customer',
    password: '',
  };
  isEditing = false;

  readonly cols = [
    { key: 'firstName', label: 'First' },
    { key: 'lastName', label: 'Last' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: '_restricted', label: 'Restricted' },
    { key: '_hidden', label: 'Hidden' },
  ];

  readonly tableRows = computed(() => {
    this.policy.version();
    return this.rawUsers()
      .filter((u) => (this.showDeleted() ? true : !this.policy.isSoftDeleted(u.id)))
      .map((u) => ({
        ...u,
        _restricted: this.policy.isRestricted(u.id) ? 'Yes' : '',
        _hidden: this.policy.isSoftDeleted(u.id) ? 'Yes' : '',
      })) as unknown as Record<string, unknown>[];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.getUsers().subscribe({
      next: (d) => {
        this.rawUsers.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  userFromRow(row: Record<string, unknown>): IUser | undefined {
    const id = row['id'];
    return this.rawUsers().find((u) => u.id == id);
  }

  editFromRow(row: Record<string, unknown>): void {
    const u = this.userFromRow(row);
    if (u) this.editUser(u);
  }

  editUser(user: IUser): void {
    this.isEditing = true;
    this.formUser = { ...user };
  }

  addUser(): void {
    this.usersService.addUser(this.formUser).subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
    });
  }

  updateUser(): void {
    this.usersService.saveAdminUserEdits(this.formUser).subscribe((updated) => {
      this.rawUsers.update((list) =>
        list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );
      this.resetForm();
    });
  }

  deleteUserApi(id: unknown): void {
    if (id == null) return;
    this.policy.setSoftDeleted(String(id), true);
    this.load();
  }

  toggleRestrict(row: Record<string, unknown>): void {
    const u = this.userFromRow(row);
    if (u?.id == null) return;
    this.policy.setRestricted(u.id, !this.policy.isRestricted(u.id));
  }

  toggleSoftDelete(row: Record<string, unknown>): void {
    const u = this.userFromRow(row);
    if (u?.id == null) return;
    this.policy.setSoftDeleted(u.id, !this.policy.isSoftDeleted(u.id));
  }

  onSubmit(): void {
    if (this.isEditing) this.updateUser();
    else this.addUser();
  }

  resetForm(): void {
    this.formUser = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'Customer',
      password: '',
    };
    this.isEditing = false;
  }
}
