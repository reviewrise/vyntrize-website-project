'use client';

import { createContext, useContext } from 'react';

export interface CookieConsent {
    version: string;
    timestamp: string;
    essential: true;
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
}

export interface CookieConsentContextValue {
    consent: CookieConsent | null;
    showBanner: boolean;
    acceptAll: () => void;
    rejectAll: () => void;
    savePreferences: (prefs: { analytics: boolean; functional: boolean; marketing: boolean }) => void;
    openSettings: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
    const ctx = useContext(CookieConsentContext);
    if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider');
    return ctx;
}

export const CONSENT_KEY = 'vr_consent';
export const CONSENT_VERSION = '1.0';

export function readConsent(): CookieConsent | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CookieConsent;
        if (parsed.version !== CONSENT_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function writeConsent(
    prefs: Omit<CookieConsent, 'version' | 'timestamp' | 'essential'>
): CookieConsent {
    const consent: CookieConsent = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        essential: true,
        ...prefs,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    document.cookie = `vr_consent_given=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    return consent;
}
