'use client';

import { useEffect, useState } from 'react';
import {
    CookieConsentContext,
    CookieConsent,
    readConsent,
    writeConsent,
} from '@/hooks/useCookieConsent';

export default function CookieConsentProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [consent, setConsent] = useState<CookieConsent | null>(() => readConsent());
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (consent) return;
        const t = setTimeout(() => setShowBanner(true), 800);
        return () => clearTimeout(t);
    }, [consent]);

    function acceptAll() {
        const c = writeConsent({ analytics: true, functional: true, marketing: true });
        setConsent(c);
        setShowBanner(false);
    }

    function rejectAll() {
        const c = writeConsent({ analytics: false, functional: false, marketing: false });
        setConsent(c);
        setShowBanner(false);
    }

    function savePreferences(prefs: { analytics: boolean; functional: boolean; marketing: boolean }) {
        const c = writeConsent(prefs);
        setConsent(c);
        setShowBanner(false);
    }

    function openSettings() {
        setShowBanner(true);
    }

    return (
        <CookieConsentContext.Provider
            value={{ consent, showBanner, acceptAll, rejectAll, savePreferences, openSettings }}
        >
            {children}
        </CookieConsentContext.Provider>
    ) as unknown as React.ReactElement;
}
