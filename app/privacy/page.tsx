import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sparkurio",
  description: "How Sparkurio collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FDFCFB]">
      {/* Minimal header */}
      <div className="border-b border-ink/8 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-ink/80 hover:text-ink transition-colors">
          Sparkurio
        </Link>
        <Link href="/terms" className="text-sm text-ink/40 hover:text-papaya transition-colors">
          Terms of Service →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-ink/90 mb-2">Privacy Policy</h1>
        <p className="text-ink/40 text-sm mb-12">Last updated: April 12, 2026</p>

        <div className="prose prose-neutral max-w-none space-y-10 text-ink/70 leading-relaxed text-[15px]">

          <section>
            <p>
              This Privacy Policy describes how Sparkurio ("we," "us," or "our") collects, uses, and shares information about you when you use our Service. By using the Service, you agree to the collection and use of information as described here.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">1. Information We Collect</h2>

            <h3 className="font-medium text-ink/70 mb-2">Information you provide directly</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Account information: name, email address, and password when you register</li>
              <li>Profile information: display name, bio, and profile photo you choose to upload</li>
              <li>Content: images, notes, board names, comments, and reactions you post</li>
              <li>Communications: messages you send us or post through team or board features</li>
            </ul>

            <h3 className="font-medium text-ink/70 mt-5 mb-2">Information collected automatically</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Usage data: pages viewed, features used, searches performed, and actions taken on the Service</li>
              <li>Device and browser information: browser type, operating system, and screen resolution</li>
              <li>IP address and approximate location derived from it</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>

            <h3 className="font-medium text-ink/70 mt-5 mb-2">Information from third parties</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>If you sign in using a third-party service (such as Google), we receive basic profile information that service provides</li>
              <li>Images and metadata from third-party websites you choose to import into the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Operate, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Enable collaboration features including boards, teams, comments, and activity feeds</li>
              <li>Send transactional emails such as invitations, notifications, and password resets</li>
              <li>Detect, investigate, and prevent fraud, abuse, and violations of our Terms of Service</li>
              <li>Analyze usage patterns to understand how the Service is used and make improvements</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties. We do not use your content to train AI or machine learning models.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">3. How We Share Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong className="text-ink/70">With other users:</strong> Content you post on public boards or in team spaces is visible to other users as intended by those features. Your display name and profile photo are associated with your contributions.</li>
              <li><strong className="text-ink/70">Service providers:</strong> We share information with third-party vendors who perform services on our behalf, such as cloud hosting, authentication, email delivery, and image processing. These vendors are contractually obligated to protect your information and use it only for the services they provide to us.</li>
              <li><strong className="text-ink/70">Legal compliance:</strong> We may disclose information if required by law, subpoena, or other legal process, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
              <li><strong className="text-ink/70">Business transfers:</strong> If Sparkurio is acquired, merged, or otherwise transferred, your information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored using Supabase, a cloud database and storage provider. Images you upload are stored in Supabase Storage. Authentication is managed through Supabase Auth using industry-standard encryption.
            </p>
            <p className="mt-3">
              We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no security measure is perfect, and we cannot guarantee the absolute security of your information. You use the Service at your own risk.
            </p>
            <p className="mt-3">
              We retain your information for as long as your account is active or as needed to provide you the Service. You may request deletion of your account and associated data at any time (see Section 8).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">5. Third-Party Services</h2>
            <p>
              The Service integrates with or links to third-party services and websites, including but not limited to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong className="text-ink/70">Supabase</strong> — database, storage, and authentication</li>
              <li><strong className="text-ink/70">Vercel</strong> — hosting and image optimization</li>
              <li><strong className="text-ink/70">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-ink/70">Anthropic (Claude API)</strong> — AI-based image content moderation</li>
            </ul>
            <p className="mt-3">
              When you import images from third-party websites, those websites may log your request. We are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">6. Cookies</h2>
            <p>
              We use cookies and similar technologies (such as local storage) to maintain your session, remember your preferences, and understand how you use the Service. These are essential to the Service's functionality. We do not use third-party advertising cookies.
            </p>
            <p className="mt-3">
              You can configure your browser to refuse cookies, but doing so may prevent some features of the Service from working correctly.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">7. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly. If you believe a child under 13 has provided us personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">8. Your Rights and Choices</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information in your account</li>
              <li>Request deletion of your account and associated personal information</li>
              <li>Object to or restrict certain processing of your information</li>
              <li>Receive a copy of your information in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at the address in Section 10. We will respond within a reasonable timeframe. Note that some information may be retained where required by law or for legitimate business purposes.
            </p>
            <p className="mt-3">
              You may update your profile information and notification preferences at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by updating the "Last updated" date above and, where appropriate, by sending you an email or in-product notice. Your continued use of the Service after any change constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">10. Contact</h2>
            <p>
              Questions or requests regarding this Privacy Policy may be directed to:<br />
              <a href="mailto:admin@sparkurio.com" className="text-papaya hover:text-papaya/70 transition-colors">admin@sparkurio.com</a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-ink/8 flex gap-6 text-sm text-ink/40">
          <Link href="/terms" className="hover:text-papaya transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-papaya transition-colors">Back to Sparkurio</Link>
        </div>
      </div>
    </main>
  );
}
