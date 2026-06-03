import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-16 h-16 mb-6 text-gray-300 mx-auto">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Page Not Found</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        We couldn't find the requested resource or record.
      </p>
      <Link href="/dashboard" 
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}>
        Return to Dashboard
      </Link>
    </div>
  );
}
