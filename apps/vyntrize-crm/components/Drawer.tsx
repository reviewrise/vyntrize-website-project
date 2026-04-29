'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function Drawer({ open, onClose, title, children, width = '420px' }: DrawerProps) {
    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div className="drawer-overlay" onClick={onClose} />

            {/* Panel */}
            <div className="drawer-panel" style={{ width }}>
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {title}
                    </h2>
                    <button onClick={onClose} className="btn-ghost h-7 w-7 p-0 flex items-center justify-center">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {children}
                </div>
            </div>
        </>
    );
}
