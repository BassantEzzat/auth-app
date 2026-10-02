import { Injectable, computed, signal } from '@angular/core';
import { AuthResult, User } from './user.model';

const USERS_KEY = 'auth_app_users';
const SESSION_KEY = 'auth_app_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<User | null>(this.restoreSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  /** بيستخدمه الـ validator بتاع الإيميل */
  emailExists(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.readUsers().some(u => u.email === normalized);
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.emailExists(normalizedEmail)) {
      return { ok: false, error: 'This email is already registered.' };
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hash(password, salt);

    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    this.writeUsers([...this.readUsers(), user]);
    this.startSession(user);
    return { ok: true };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.readUsers().find(u => u.email === normalizedEmail);

    // نفس الرسالة في الحالتين عشان منكشفش إن الإيميل موجود ولا لأ
    const invalid: AuthResult = { ok: false, error: 'Invalid email or password.' };
    if (!user) return invalid;

    const hash = await this.hash(password, user.salt);
    if (hash !== user.passwordHash) return invalid;

    this.startSession(user);
    return { ok: true };
  }

  logout(): void {
    this.safeStorage(() => localStorage.removeItem(SESSION_KEY));
    this._currentUser.set(null);
  }

  // ---------- private helpers ----------

  private startSession(user: User): void {
    this.safeStorage(() => localStorage.setItem(SESSION_KEY, user.id));
    this._currentUser.set(user);
  }

  private restoreSession(): User | null {
    const id = this.safeStorage(() => localStorage.getItem(SESSION_KEY));
    if (!id) return null;
    return this.readUsers().find(u => u.id === id) ?? null;
  }

  private readUsers(): User[] {
    const raw = this.safeStorage(() => localStorage.getItem(USERS_KEY));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as User[]) : [];
    } catch {
      return [];
    }
  }

  private writeUsers(users: User[]): void {
    this.safeStorage(() => localStorage.setItem(USERS_KEY, JSON.stringify(users)));
  }

  private generateSalt(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hash(password: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(salt + password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  private safeStorage<T>(fn: () => T): T | null {
    try {
      return fn();
    } catch {
      return null;
    }
  }
}