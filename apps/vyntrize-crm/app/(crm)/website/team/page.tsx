import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

const team = [
    { name: 'Abdisa Bati', title: 'Founder & CEO', tag: 'Founder & CEO', photo: null, initials: 'AB' },
    { name: 'Abenezer Seyoum', title: 'Chief Technology Officer', tag: 'CTO', photo: '/images/teams/Abenezer Seyoum.png', initials: 'AS' },
    { name: 'Biniyam Lombe', title: 'AI Systems Architect & LLM Engineer', tag: 'AI Engineering', photo: '/images/teams/Biniyam Lombe.jpg', initials: 'BL' },
    { name: 'Mesay Alemayehu', title: 'Digital Marketing Strategist & Analyst', tag: 'Marketing & Strategy', photo: '/images/teams/Mesay Alemayehu .jpg', initials: 'MA' },
    { name: 'Gedion Bula', title: 'Business Intelligence & Performance Manager', tag: 'Business Intelligence', photo: '/images/teams/Gedion Bula.jpg', initials: 'GB' },
    { name: 'Mahlet Getachew', title: 'Team Member', tag: 'Team', photo: '/images/teams/Mahlet Getachew .jpg', initials: 'MG' },
    { name: 'Abel Legesse', title: 'Software Engineer', tag: 'Engineering', photo: '/images/teams/2026-04-07 18.00.52.jpg', initials: 'AL' },
];

export default function WebsiteTeam() {
    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Team</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{team.length} members</p>
                </div>
                <Link href="https://vyntrise.com/about#team" target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl px-4 py-2 transition-colors"
                    style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    <ExternalLink className="h-3.5 w-3.5" /> View on site
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="grid grid-cols-[48px_1fr_160px_120px] px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <span /><span>Name</span><span>Title</span><span>Department</span>
                </div>

                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {team.map((member, i) => (
                        <div key={member.name}
                            className="grid grid-cols-[48px_1fr_160px_120px] px-5 py-3.5 items-center"
                            style={{ borderBottom: i < team.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0">
                                {member.photo ? (
                                    <Image src={member.photo} alt={member.name} fill className="object-cover" sizes="36px" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-white text-[10px] font-bold"
                                        style={{ background: 'linear-gradient(135deg, #41A5FF, #2A52BE)' }}>
                                        {member.initials}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{member.name}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{member.title}</p>
                            <span className="text-[10px] font-semibold rounded-full px-2.5 py-0.5 w-fit"
                                style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                {member.tag}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
