export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface LoginResponse {
  token: string;
  expiration: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface AuthResponse {
  token?: string;
  expiration?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  /** legacy fallbacks */
  Token?: string;
  access_token?: string;
  accessToken?: string;
  role?: string;
  Role?: string;
}

export function normalizeAuthResponse(raw: unknown): AuthResponse {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;

  const token = (o['token'] ?? o['Token'] ?? o['access_token'] ?? o['accessToken']) as string | undefined;

  const rolesRaw = o['roles'];
  let roles: string[] | undefined;
  if (Array.isArray(rolesRaw)) {
    roles = rolesRaw.map(String);
  } else if (typeof rolesRaw === 'string' && rolesRaw.trim()) {
    roles = [rolesRaw.trim()];
  } else {
    const r = (o['role'] ?? o['Role']) as string | undefined;
    roles = r ? [r] : undefined;
  }

  return {
    token,
    expiration: (o['expiration'] ?? o['Expiration']) as string | undefined,
    firstName: (o['firstName'] ?? o['FirstName']) as string | undefined,
    lastName: (o['lastName'] ?? o['LastName']) as string | undefined,
    roles,
  };
}

export function resolvedAuthToken(res: AuthResponse): string | null {
  const t = res.token ?? res.Token ?? res.access_token ?? res.accessToken;
  return t ? String(t) : null;
}