'use client';

import { useCookieConsent } from '@/hooks/useCookieConsent';

export default function CookieSettingsButton() {
    const { openSettings } = useCookieConsent();
    return (
        <button
            onClick={openSettings}
            className="transition-colors text-xs"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
            Cookie Settings
        </button>
    );
}
