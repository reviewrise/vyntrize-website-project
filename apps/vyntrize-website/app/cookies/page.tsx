import LegalLayout, { LegalSection } from '@/components/LegalLayout';
import Link from 'next/link';

const sections: LegalSection[] = [
    { id: 'what-are-cookies', title: 'What Are Cookies' },
    { id: 'types', title: 'Types of Cookies We Use' },
    { id: 'cookie-table', title: 'Cookie Table' },
    { id: 'managing', title: 'Managing Your Preferences' },
    { id: 'third-party', title: 'Third-Party Cookies' },
    { id: 'do-not-track', title: 'Do Not Track' },
    { id: 'changes', title: 'Updates to This Policy' },
    { id: 'contact', title: 'Contact' },
];

export default function CookiesPage() {
    return (
        <LegalLayout
            badge="LEGAL"
            title="Cookie Policy"
            subtitle="This policy explains how VyntRise uses cookies and similar technologies, and how you can control them."
            lastUpdated="January 1, 2026"
            effectiveDate="January 1, 2026"
            sections={sections}
        >
            <section id="what-are-cookies">
                <h2>1. What Are Cookies</h2>
                <div className="callout">
                    <p className="callout-label">In plain English</p>
                    <p>Cookies are small text files stored on your device that help websites remember you and work properly. We use them to keep you logged in, understand how you use our platform, and improve your experience.</p>
                </div>
                <p>Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.</p>
                <p>We also use similar technologies such as web beacons, pixels, and local storage that function similarly to cookies. This policy covers all such technologies collectively referred to as &quot;cookies.&quot;</p>
            </section>

            <div className="section-divider" />

            <section id="types">
                <h2>2. Types of Cookies We Use</h2>

                <h3>Essential Cookies</h3>
                <p>These cookies are strictly necessary for the Services to function. They enable core features like authentication, security, and session management. You cannot opt out of these cookies as the Services cannot function without them.</p>

                <h3>Analytics Cookies</h3>
                <p>These cookies help us understand how visitors interact with our platform — which pages are visited most, where users drop off, and how features are used. This data is aggregated and anonymized. We use this to improve the Services.</p>

                <h3>Functional Cookies</h3>
                <p>These cookies remember your preferences and settings (such as language, timezone, and dashboard layout) to provide a more personalized experience. Disabling these may affect some features.</p>

                <h3>Marketing Cookies</h3>
                <p>These cookies track your activity across websites to deliver relevant advertising and measure campaign effectiveness. We only set marketing cookies with your explicit consent.</p>
            </section>

            <div className="section-divider" />

            <section id="cookie-table">
                <h2>3. Cookie Table</h2>
                <p>Below is a list of the specific cookies we use:</p>

                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Purpose</th>
                            <th>Duration</th>
                            <th>Provider</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>vr_session</code></td>
                            <td>Essential</td>
                            <td>Maintains your authenticated session</td>
                            <td>Session</td>
                            <td>VyntRise</td>
                        </tr>
                        <tr>
                            <td><code>vr_csrf</code></td>
                            <td>Essential</td>
                            <td>Prevents cross-site request forgery attacks</td>
                            <td>Session</td>
                            <td>VyntRise</td>
                        </tr>
                        <tr>
                            <td><code>vr_prefs</code></td>
                            <td>Functional</td>
                            <td>Stores your dashboard preferences and settings</td>
                            <td>1 year</td>
                            <td>VyntRise</td>
                        </tr>
                        <tr>
                            <td><code>_vr_analytics</code></td>
                            <td>Analytics</td>
                            <td>Tracks page views and feature usage (anonymized)</td>
                            <td>90 days</td>
                            <td>VyntRise</td>
                        </tr>
                        <tr>
                            <td><code>_mp_id</code></td>
                            <td>Analytics</td>
                            <td>Mixpanel user identification for product analytics</td>
                            <td>1 year</td>
                            <td>Mixpanel</td>
                        </tr>
                        <tr>
                            <td><code>_ga</code></td>
                            <td>Analytics</td>
                            <td>Google Analytics — distinguishes unique users</td>
                            <td>2 years</td>
                            <td>Google</td>
                        </tr>
                        <tr>
                            <td><code>_fbp</code></td>
                            <td>Marketing</td>
                            <td>Facebook Pixel — tracks conversions from ads</td>
                            <td>90 days</td>
                            <td>Meta</td>
                        </tr>
                        <tr>
                            <td><code>_gcl_au</code></td>
                            <td>Marketing</td>
                            <td>Google Ads conversion tracking</td>
                            <td>90 days</td>
                            <td>Google</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <div className="section-divider" />

            <section id="managing">
                <h2>4. Managing Your Preferences</h2>
                <div className="callout">
                    <p className="callout-label">Your choice</p>
                    <p>You can update your cookie preferences at any time. Essential cookies cannot be disabled as they are required for the platform to function.</p>
                </div>
                <h3>Cookie consent banner</h3>
                <p>When you first visit VyntRise, you will be presented with a cookie consent banner where you can accept or decline non-essential cookies. You can change your preferences at any time by clicking &quot;Cookie Settings&quot; in the footer.</p>
                <h3>Browser settings</h3>
                <p>You can also control cookies through your browser settings. Most browsers allow you to:</p>
                <ul>
                    <li>View and delete existing cookies</li>
                    <li>Block cookies from specific websites</li>
                    <li>Block all third-party cookies</li>
                    <li>Clear all cookies when you close the browser</li>
                </ul>
                <p>Note that blocking all cookies may affect the functionality of VyntRise and other websites you visit.</p>
                <h3>Opt-out links</h3>
                <ul>
                    <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                    <li>Mixpanel: <a href="https://mixpanel.com/optout" target="_blank" rel="noopener noreferrer">Mixpanel Opt-out</a></li>
                    <li>Meta/Facebook: <a href="https://www.facebook.com/settings/?tab=ads" target="_blank" rel="noopener noreferrer">Facebook Ad Settings</a></li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="third-party">
                <h2>5. Third-Party Cookies</h2>
                <p>Some cookies on our platform are set by third-party services we use. These third parties have their own privacy policies and cookie practices, which we encourage you to review:</p>
                <ul>
                    <li><strong>Google</strong> — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                    <li><strong>Meta (Facebook)</strong> — <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a></li>
                    <li><strong>Mixpanel</strong> — <a href="https://mixpanel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Mixpanel Privacy Policy</a></li>
                    <li><strong>Stripe</strong> — <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
                </ul>
            </section>

            <div className="section-divider" />

            <section id="do-not-track">
                <h2>6. Do Not Track</h2>
                <p>Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites that you do not want to be tracked. Currently, there is no universally accepted standard for how websites should respond to DNT signals.</p>
                <p>We honor DNT signals for analytics and marketing cookies. When a DNT signal is detected, we will not set non-essential cookies for that session.</p>
            </section>

            <div className="section-divider" />

            <section id="changes">
                <h2>7. Updates to This Policy</h2>
                <p>We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of material changes through our platform or by email.</p>
                <p>The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised.</p>
            </section>

            <div className="section-divider" />

            <section id="contact">
                <h2>8. Contact</h2>
                <p>If you have questions about our use of cookies, please contact us:</p>
                <ul>
                    <li>Email: <a href="mailto:privacy@vyntrise.com">privacy@vyntrise.com</a></li>
                    <li>Address: VyntRise Technologies, San Francisco, CA 94105</li>
                </ul>
                <p>For general privacy questions, see our <Link href="/privacy">Privacy Policy</Link>. For other inquiries, visit our <Link href="/contact">contact page</Link>.</p>
            </section>
        </LegalLayout>
    );
}
