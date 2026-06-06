'use client';

import { useEffect } from 'react';

/** Opens the browser print dialog once the invoice has rendered. */
export function PrintOnLoad() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
