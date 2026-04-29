'use client';

import { useCookieConsent } from '@/hooks/useCookieConsent';

export default function CookieSettingsButton() {
    const { openSettings } = useCookieConsent();
    return (
        <button
            onClick={openSettings}
            className="hover:text-slate-400 transition-colors text-xs text-slate-600"
        >
            Cookie Settings
        </button>
    );
}
