import LoginForm from './LoginForm';

export default function LoginPage() {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: 'var(--color-bg)' }}
        >
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        V
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text)' }}>Vyntrize</p>
                        <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-subtle)' }}>CRM · Internal</p>
                    </div>
                </div>

                <div className="crm-card p-7">
                    <h1 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                        Sign in
                    </h1>
                    <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
                        Enter your credentials to access the CRM.
                    </p>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
