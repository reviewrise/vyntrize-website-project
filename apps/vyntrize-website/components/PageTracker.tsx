'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateSessionId(): string {
    const key = 'vr_sid';
    let sid = sessionStorage.getItem(key);
    if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem(key, sid);
    }
    return sid;
}

export function PageTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Don't track in development
        if (process.env.NODE_ENV === 'development') return;

        try {
            const sessionId = getOrCreateSessionId();
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: pathname,
                    referrer: document.referrer || null,
                    sessionId,
                }),
                // Fire and forget — don't await
                keepalive: true,
            }).catch(() => { });
        } catch {
            // Never throw
        }
    }, [pathname]);

    return null;
}
