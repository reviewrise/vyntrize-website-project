'use client';

// Simple client-side admin auth using sessionStorage
// Replace with proper auth (NextAuth, Clerk, etc.) for production

const ADMIN_KEY = 'vr_admin_session';
const ADMIN_PASSWORD = 'vyntrise2026'; // Change this

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, '1');
    return true;
  }
  return false;
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY);
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_KEY) === '1';
}
