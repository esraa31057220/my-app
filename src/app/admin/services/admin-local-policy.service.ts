import { Injectable, signal } from '@angular/core';

interface UserPolicy {
  restricted?: boolean;
  softDeleted?: boolean;
}

const LS_KEY = 'admin_user_policy_v1';

@Injectable({ providedIn: 'root' })
export class AdminLocalPolicyService {
  private readonly _version = signal(0);

  readonly version = this._version.asReadonly();

  isRestricted(userId: string | number | undefined): boolean {
    return !!this.read().get(String(userId))?.restricted;
  }

  isSoftDeleted(userId: string | number | undefined): boolean {
    return !!this.read().get(String(userId))?.softDeleted;
  }

  setRestricted(userId: string | number, value: boolean): void {
    const m = this.read();
    const id = String(userId);
    const cur = m.get(id) ?? {};
    m.set(id, { ...cur, restricted: value });
    this.write(m);
    this._version.update((v) => v + 1);
  }

  setSoftDeleted(userId: string | number, value: boolean): void {
    const m = this.read();
    const id = String(userId);
    const cur = m.get(id) ?? {};
    m.set(id, { ...cur, softDeleted: value });
    this.write(m);
    this._version.update((v) => v + 1);
  }

  private read(): Map<string, UserPolicy> {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return new Map();
      const obj = JSON.parse(raw) as Record<string, UserPolicy>;
      return new Map(Object.entries(obj));
    } catch {
      return new Map();
    }
  }

  private write(map: Map<string, UserPolicy>): void {
    const obj: Record<string, UserPolicy> = {};
    map.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  }
}
