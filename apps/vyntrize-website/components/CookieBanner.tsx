'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cookie, ChevronRight, Shield, BarChart3, Settings, Megaphone } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const categories = [
    {
        id: 'essential' as const,
        icon: Shield,
        label: 'Essential',
        description: 'Required for the website to function. Cannot be disabled.',
        examples: 'Session management, security tokens, consent storage.',
        locked: true,
    },
    {
        id: 'analytics' as const,
        icon: BarChart3,
        label: 'Analytics',
        description: 'Help us understand how visitors use our site so we can improve it.',
        examples: 'Page views, feature usage, session duration (anonymized).',
        locked: false,
    },
    {
        id: 'functional' as const,
        icon: Settings,
        label: 'Functional',
        description: 'Remember your preferences and settings for a better experience.',
        examples: 'Dashboard layout, language, timezone preferences.',
        locked: false,
    },
    {
        id: 'marketing' as const,
        icon: Megaphone,
        label: 'Marketing',
        description: 'Used to deliver relevant ads and measure campaign effectiveness.',
        examples: 'Facebook Pixel, Google Ads conversion tracking.',
        locked: false,
    },
];

interface ToggleProps {
    checked: boolean;
    disabled?: boolean;
    onChange: (v: boolean) => void;
}

function Toggle({ checked, disabled, onChange }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
            style={{
                backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
            }}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                style={{ backgroundColor: 'var(--color-bg)' }}
            />
        </button>
    );
}

export default function CookieBanner() {
    const { showBanner, acceptAll, rejectAll, savePreferences } = useCookieConsent();
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState({ analytics: true, functional: true, marketing: false });

    if (!showBanner) return null;

    function handleSave() {
        savePreferences(prefs);
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[420px] z-[100]"
            >
                <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>

                    {/* Simple banner view */}
                    {!showDetails && (
                        <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                                    <Cookie className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>We use cookies</p>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                        We use cookies to improve your experience, analyze traffic, and personalize content. See our{' '}
                                        <Link href="/cookies" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Cookie Policy</Link>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={acceptAll}
                                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                                >
                                    Accept all
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={rejectAll}
                                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                                    >
                                        Reject all
                                    </button>
                                    <button
                                        onClick={() => setShowDetails(true)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                                    >
                                        Manage <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed preferences view */}
                    {showDetails && (
                        <div>
                            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <div className="flex items-center gap-2">
                                    <Cookie className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Cookie preferences</p>
                                </div>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'var(--color-text)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="px-5 py-3 max-h-72 overflow-y-auto space-y-4">
                                {categories.map((cat) => {
                                    const CatIcon = cat.icon;
                                    const isOn = cat.locked ? true : prefs[cat.id as keyof typeof prefs] ?? false;
                                    return (
                                        <div key={cat.id} className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                                <CatIcon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{cat.label}</p>
                                                    <Toggle
                                                        checked={isOn}
                                                        disabled={cat.locked}
                                                        onChange={(v) => setPrefs(p => ({ ...p, [cat.id]: v }))}
                                                    />
                                                </div>
                                                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{cat.description}</p>
                                                <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-subtle)' }}>{cat.examples}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                                >
                                    Save preferences
                                </button>
                                <button
                                    onClick={acceptAll}
                                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                                    style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                                >
                                    Accept all
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
