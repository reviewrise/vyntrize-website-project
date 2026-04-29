import LegalLayout, { LegalSection } from '@/components/LegalLayout';
import Link from 'next/link';

const sections: LegalSection[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'information-collected', title: 'Information We Collect' },
    { id: 'how-we-use', title: 'How We Use Your Information' },
    { id: 'legal-basis', title: 'Legal Basis (GDPR)' },
    { id: 'sharing', title: 'Data Sharing & Third Parties' },
    { id: 'retention', title: 'Data Retention' },
    { id: 'your-rights', title: 'Your Rights' },
    { id: 'cookies', title: 'Cookies & Tracking' },
    { id: 'security', title: 'Data Security' },
    { id: 'international', title: 'International Transfers' },
    { id: 'children', title: "Children's Privacy" },
    { id: 'changes', title: 'Changes to This Policy' },
    { id: 'contact', title: 'Contact & DPO' },
];

export default function PrivacyPage() {
    return (
        <LegalLayout
            badge="LEGAL"
            title="Privacy Policy"
            subtitle="We take your privacy seriously. This policy explains what data we collect, why we collect it, and how you can control it."
            lastUpdated="January 1, 2026"
            effectiveDate="January 1, 2026"
            sections={sections}
        >
            <section id="overview">
                <h2>1. Overview</h2>
                <div className="callout">
                    <p className="callout-label">The short version</p>
                    <p>We collect only what we need to run our services. We don&apos;t sell your data. You can request deletion at any time.</p>
                </div>
                <p>VyntRise Technologies (&quot;VyntRise&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our platform and services.</p>
                <p>This policy applies to all users of VyntRise services and complies with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.</p>
            </section>

            <div className="section-divider" />

            <section id="information-collected">
                <h2>2. Information We Collect</h2>
                <h3>Information you provide directly</h3>
                <ul>
                    <li>Account registration data (name, email, company name)</li>
                    <li>Payment and billing information (processed securely via Stripe)</li>
                    <li>Communications you send us (support tickets, contact forms)</li>
                    <li>Content and data you upload to the platform</li>
                </ul>
                <h3>Information collected automatically</h3>
                <ul>
                    <li>Usage data (pages visited, features used, time spent)</li>
                    <li>Device and browser information (IP address, browser type, OS)</li>
                    <li>Log data (access times, error logs, API calls)</li>
                    <li>Cookies and similar tracking technologies (see our <Link href="/cookies">Cookie Policy</Link>)</li>
                </ul>
                <h3>Information from third parties</h3>
                <ul>
                    <li>Business data from connected integrations (Google Business Profile, review platforms)</li>
                    <li>Analytics data from third-party providers</li>
                    <li>Payment verification data from financial institutions</li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="how-we-use">
                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, operate, and improve our Services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send administrative communications (account updates, security alerts)</li>
                    <li>Send marketing communications (with your consent, where required)</li>
                    <li>Analyze usage patterns to improve user experience</li>
                    <li>Detect, prevent, and address fraud and security issues</li>
                    <li>Comply with legal obligations</li>
                    <li>Respond to your requests and provide customer support</li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="legal-basis">
                <h2>4. Legal Basis for Processing (GDPR)</h2>
                <p>For users in the European Economic Area (EEA), we process your personal data under the following legal bases:</p>
                <ul>
                    <li><strong>Contract performance</strong> — processing necessary to provide the Services you&apos;ve subscribed to</li>
                    <li><strong>Legitimate interests</strong> — improving our Services, fraud prevention, and security</li>
                    <li><strong>Consent</strong> — marketing communications and non-essential cookies</li>
                    <li><strong>Legal obligation</strong> — compliance with applicable laws and regulations</li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="sharing">
                <h2>5. Data Sharing &amp; Third Parties</h2>
                <div className="callout">
                    <p className="callout-label">Our commitment</p>
                    <p>We never sell your personal data. We only share it with trusted partners who help us deliver our services.</p>
                </div>
                <p>We may share your information with:</p>
                <ul>
                    <li><strong>Service providers</strong> — cloud hosting (AWS), payment processing (Stripe), analytics (Mixpanel), email delivery (Resend)</li>
                    <li><strong>Business partners</strong> — only with your explicit consent for specific integrations</li>
                    <li><strong>Legal authorities</strong> — when required by law, court order, or to protect our rights</li>
                    <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets (with notice to you)</li>
                </ul>
                <p>All third-party service providers are contractually bound to process your data only as instructed and in compliance with applicable privacy laws.</p>
            </section>

            <div className="section-divider" />

            <section id="retention">
                <h2>6. Data Retention</h2>
                <p>We retain your personal data for as long as necessary to provide the Services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
                <ul>
                    <li><strong>Account data</strong> — retained for the duration of your account plus 30 days after deletion</li>
                    <li><strong>Transaction records</strong> — retained for 7 years for tax and legal compliance</li>
                    <li><strong>Usage logs</strong> — retained for 90 days</li>
                    <li><strong>Marketing data</strong> — retained until you withdraw consent</li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="your-rights">
                <h2>7. Your Rights</h2>
                <div className="callout">
                    <p className="callout-label">You are in control</p>
                    <p>You can exercise any of these rights by contacting us at <a href="mailto:privacy@vyntrise.com">privacy@vyntrise.com</a>. We respond within 30 days.</p>
                </div>
                <p>Depending on your location, you may have the following rights:</p>
                <ul>
                    <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                    <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data</li>
                    <li><strong>Erasure</strong> — request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                    <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
                    <li><strong>Restriction</strong> — request that we limit how we process your data</li>
                    <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
                    <li><strong>Withdraw consent</strong> — withdraw consent at any time where processing is consent-based</li>
                </ul>
                <p>California residents have additional rights under the CCPA, including the right to know, delete, and opt-out of the sale of personal information (we do not sell personal information).</p>
            </section>

            <div className="section-divider" />

            <section id="cookies">
                <h2>8. Cookies &amp; Tracking</h2>
                <p>We use cookies and similar tracking technologies to operate and improve our Services. For detailed information about the cookies we use and how to manage your preferences, please see our <Link href="/cookies">Cookie Policy</Link>.</p>
            </section>

            <div className="section-divider" />

            <section id="security">
                <h2>9. Data Security</h2>
                <p>We implement industry-standard security measures to protect your personal data, including:</p>
                <ul>
                    <li>TLS/SSL encryption for all data in transit</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Role-based access controls and least-privilege principles</li>
                    <li>SOC 2 Type II compliance</li>
                </ul>
                <p>While we take reasonable precautions, no security system is impenetrable. In the event of a data breach that affects your rights, we will notify you as required by applicable law.</p>
            </section>

            <div className="section-divider" />

            <section id="international">
                <h2>10. International Data Transfers</h2>
                <p>VyntRise operates primarily in the United States. If you are located outside the US, your data may be transferred to and processed in the US or other countries.</p>
                <p>For transfers from the EEA, UK, or Switzerland, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission to ensure adequate protection of your personal data.</p>
            </section>

            <div className="section-divider" />

            <section id="children">
                <h2>11. Children&apos;s Privacy</h2>
                <p>Our Services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately and we will delete it.</p>
            </section>

            <div className="section-divider" />

            <section id="changes">
                <h2>12. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on our platform at least 14 days before the changes take effect.</p>
                <p>Your continued use of the Services after the effective date constitutes acceptance of the updated policy.</p>
            </section>

            <div className="section-divider" />

            <section id="contact">
                <h2>13. Contact &amp; Data Protection Officer</h2>
                <p>For privacy-related questions, requests, or concerns, please contact:</p>
                <ul>
                    <li><strong>Privacy Team:</strong> <a href="mailto:privacy@vyntrise.com">privacy@vyntrise.com</a></li>
                    <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@vyntrise.com">dpo@vyntrise.com</a></li>
                    <li><strong>Address:</strong> VyntRise Technologies, San Francisco, CA 94105</li>
                </ul>
                <p>If you are in the EEA and believe we have not adequately addressed your privacy concerns, you have the right to lodge a complaint with your local data protection authority.</p>
            </section>
        </LegalLayout>
    );
}
