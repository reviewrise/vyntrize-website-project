/**
 * Minimal layout for invoice print/PDF — no sidebar, header, or CRM chrome.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        padding: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}
