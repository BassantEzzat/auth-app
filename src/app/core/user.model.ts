export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string };