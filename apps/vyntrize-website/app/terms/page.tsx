import LegalLayout, { LegalSection } from '@/components/LegalLayout';
import Link from 'next/link';

const sections: LegalSection[] = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'services', title: 'Description of Services' },
    { id: 'accounts', title: 'User Accounts' },
    { id: 'acceptable-use', title: 'Acceptable Use' },
    { id: 'payment', title: 'Payment & Billing' },
    { id: 'ip', title: 'Intellectual Property' },
    { id: 'confidentiality', title: 'Confidentiality' },
    { id: 'disclaimers', title: 'Disclaimers' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'termination', title: 'Termination' },
    { id: 'governing-law', title: 'Governing Law' },
    { id: 'changes', title: 'Changes to Terms' },
    { id: 'contact', title: 'Contact' },
];

export default function TermsPage() {
    return (
        <LegalLayout
            badge="LEGAL"
            title="Terms of Service"
            subtitle="Please read these terms carefully before using VyntRise. By accessing or using our platform, you agree to be bound by these terms."
            lastUpdated="January 1, 2026"
            effectiveDate="January 1, 2026"
            sections={sections}
        >
            <section id="acceptance">
                <h2>1. Acceptance of Terms</h2>
                <div className="callout">
                    <p className="callout-label">TL;DR</p>
                    <p>By using VyntRise, you agree to these terms. If you don&apos;t agree, please don&apos;t use our services.</p>
                </div>
                <p>By accessing or using the VyntRise platform, website, or any associated services (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). These Terms apply to all visitors, users, and others who access or use the Services.</p>
                <p>If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms, and &quot;you&quot; refers to both you and that organization.</p>
            </section>

            <div className="section-divider" />

            <section id="services">
                <h2>2. Description of Services</h2>
                <p>VyntRise provides AI-powered business growth solutions including, but not limited to:</p>
                <ul>
                    <li>AI Search &amp; Reputation Optimization (AISO)</li>
                    <li>Intelligent automation and multi-agent workflow orchestration</li>
                    <li>Custom software development and AI integration</li>
                    <li>Data architecture, analytics, and pipeline management</li>
                    <li>Digital marketing and content strategy services</li>
                </ul>
                <p>We reserve the right to modify, suspend, or discontinue any part of the Services at any time with reasonable notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of Services.</p>
            </section>

            <div className="section-divider" />

            <section id="accounts">
                <h2>3. User Accounts &amp; Responsibilities</h2>
                <p>To access certain features of the Services, you must create an account. You agree to:</p>
                <ul>
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                </ul>
                <p>You may not share your account credentials with any third party. VyntRise reserves the right to terminate accounts that violate these Terms.</p>
            </section>

            <div className="section-divider" />

            <section id="acceptable-use">
                <h2>4. Acceptable Use Policy</h2>
                <div className="callout">
                    <p className="callout-label">Important</p>
                    <p>Use our platform to grow your business — not to harm others. Violations may result in immediate account termination.</p>
                </div>
                <p>You agree not to use the Services to:</p>
                <ul>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Transmit any harmful, offensive, or fraudulent content</li>
                    <li>Attempt to gain unauthorized access to any systems or networks</li>
                    <li>Interfere with or disrupt the integrity or performance of the Services</li>
                    <li>Collect or harvest any personally identifiable information without consent</li>
                    <li>Use the Services for any competitive intelligence or benchmarking purposes</li>
                    <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="payment">
                <h2>5. Payment &amp; Billing</h2>
                <h3>Subscription Plans</h3>
                <p>VyntRise offers monthly and annual subscription plans. By subscribing, you authorize us to charge your payment method on a recurring basis until you cancel.</p>
                <h3>Billing Cycle</h3>
                <p>Monthly subscriptions are billed on the same date each month. Annual subscriptions are billed upfront for 12 months. All fees are non-refundable except as required by law or as explicitly stated in our refund policy.</p>
                <h3>Price Changes</h3>
                <p>We may change our pricing at any time. We will provide at least 30 days&apos; notice before any price increase takes effect for existing subscribers.</p>
                <h3>Taxes</h3>
                <p>You are responsible for all applicable taxes. Where required by law, VyntRise will collect and remit taxes on your behalf.</p>
            </section>

            <div className="section-divider" />

            <section id="ip">
                <h2>6. Intellectual Property</h2>
                <p>The Services and all content, features, and functionality — including but not limited to software, text, graphics, logos, and data — are owned by VyntRise and are protected by intellectual property laws.</p>
                <p>You retain ownership of any data or content you submit to the Services (&quot;Your Content&quot;). By submitting Your Content, you grant VyntRise a limited, non-exclusive license to use, process, and display Your Content solely to provide the Services to you.</p>
                <p>You may not copy, modify, distribute, sell, or lease any part of the Services without our prior written consent.</p>
            </section>

            <div className="section-divider" />

            <section id="confidentiality">
                <h2>7. Confidentiality</h2>
                <p>Each party agrees to keep confidential any non-public information disclosed by the other party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.</p>
                <p>This obligation does not apply to information that: (a) is or becomes publicly known through no breach of this agreement; (b) was rightfully known before disclosure; (c) is independently developed without use of confidential information; or (d) is required to be disclosed by law.</p>
            </section>

            <div className="section-divider" />

            <section id="disclaimers">
                <h2>8. Disclaimers</h2>
                <p>THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
                <p>VyntRise does not warrant that the Services will be uninterrupted, error-free, or completely secure. We do not warrant the accuracy or completeness of any information provided through the Services.</p>
            </section>

            <div className="section-divider" />

            <section id="liability">
                <h2>9. Limitation of Liability</h2>
                <div className="callout">
                    <p className="callout-label">Key Point</p>
                    <p>Our liability is limited to the amount you paid us in the 12 months before the claim arose.</p>
                </div>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VYNTRISE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL.</p>
                <p>IN NO EVENT SHALL VYNTRISE&apos;S TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID FOR THE SERVICES IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).</p>
            </section>

            <div className="section-divider" />

            <section id="termination">
                <h2>10. Termination</h2>
                <p>You may cancel your account at any time through your account settings or by contacting us. Cancellation takes effect at the end of your current billing period.</p>
                <p>We may suspend or terminate your access to the Services immediately, without prior notice, if you breach these Terms or if we reasonably believe your use poses a risk to the Services or other users.</p>
                <p>Upon termination, your right to use the Services ceases immediately. We will retain your data for 30 days after termination, after which it may be permanently deleted.</p>
            </section>

            <div className="section-divider" />

            <section id="governing-law">
                <h2>11. Governing Law</h2>
                <p>These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
                <p>Any disputes arising from these Terms or the Services shall be resolved through binding arbitration in San Francisco, California, except that either party may seek injunctive relief in any court of competent jurisdiction.</p>
            </section>

            <div className="section-divider" />

            <section id="changes">
                <h2>12. Changes to Terms</h2>
                <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes by email or through a prominent notice on the Services at least 14 days before the changes take effect.</p>
                <p>Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance of the changes.</p>
            </section>

            <div className="section-divider" />

            <section id="contact">
                <h2>13. Contact</h2>
                <p>If you have questions about these Terms, please contact us:</p>
                <ul>
                    <li>Email: <a href="mailto:legal@vyntrise.com">legal@vyntrise.com</a></li>
                    <li>Address: VyntRise Technologies, San Francisco, CA 94105</li>
                </ul>
                <p>For general inquiries, visit our <Link href="/contact">contact page</Link>.</p>
            </section>
        </LegalLayout>
    );
}
