import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Sparkurio",
  description: "Terms and conditions for using Sparkurio.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cork-warm">
      {/* Minimal header */}
      <div className="border-b border-ink/8 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-ink/80 hover:text-ink transition-colors">
          Sparkurio
        </Link>
        <Link href="/privacy" className="text-sm text-ink/40 hover:text-papaya transition-colors">
          Privacy Policy →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-ink/90 mb-2">Terms of Service</h1>
        <p className="text-ink/40 text-sm mb-12">Last updated: April 12, 2026</p>

        <div className="prose prose-neutral max-w-none space-y-10 text-ink/70 leading-relaxed text-[15px]">

          <section>
            <p>
              These Terms of Service ("Terms") govern your access to and use of Sparkurio ("Service," "we," "us," or "our"). By creating an account or using the Service in any way, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">1. The Service</h2>
            <p>
              Sparkurio is a platform that allows educators to collect, organize, and share classroom resources in collaborative collections. The Service is provided "as is" and may change, be suspended, or be discontinued at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf. By using the Service, you represent and warrant that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">3. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use. We are not liable for any loss arising from unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">4. User Content</h2>
            <p>
              You retain ownership of content you post ("User Content"). By posting content, you grant Sparkurio a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, display, distribute, and prepare derivative works of your User Content solely to operate and improve the Service.
            </p>
            <p className="mt-3">
              You represent and warrant that: (a) you own or have the necessary rights to the User Content you post; (b) your User Content does not infringe any third-party intellectual property, privacy, or other rights; and (c) your User Content complies with these Terms and all applicable laws.
            </p>
            <p className="mt-3">
              We reserve the right to remove any User Content at any time and for any reason, including content we determine in our sole discretion to violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">5. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Post content you do not have the right to share</li>
              <li>Post content that is illegal, defamatory, obscene, or harassing</li>
              <li>Post nudity, pornography, or sexually explicit content of any kind</li>
              <li>Post AI-generated imagery in violation of our content guidelines</li>
              <li>Attempt to circumvent our AI detection or content moderation systems</li>
              <li>Use the Service to transmit spam or unsolicited communications</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Scrape or harvest data from the Service without our written permission</li>
              <li>Use the Service in any way that could damage, disable, or impair it</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">6. Child Safety and CSAM</h2>
            <p>
              The sexual exploitation of minors is strictly prohibited on the Service. You may not upload, share, or otherwise distribute any content that sexually exploits or depicts a minor (any person under 18 years of age) in a sexual manner. This includes but is not limited to child sexual abuse material (CSAM).
            </p>
            <p className="mt-3">
              We use automated systems to detect such content. Any image identified as CSAM or potentially exploiting a minor is immediately blocked and logged for review.
            </p>
            <p className="mt-3">
              Pursuant to 18 U.S.C. § 2258A, we are legally required to report any known or apparent CSAM to the National Center for Missing &amp; Exploited Children (NCMEC) via the CyberTipline at <strong className="text-ink/70">www.cybertipline.org</strong>. We cooperate fully with law enforcement investigations. Violation of this section may result in immediate account termination and referral to appropriate authorities.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">7. Third-Party Content and Images</h2>
            <p>
              The Service enables users to import images from third-party websites. We do not host, control, or endorse such third-party content. You are solely responsible for ensuring you have the right to use any image you import. We are not liable for copyright infringement or other intellectual property claims arising from content you import from third-party sources.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">8. DMCA / Copyright</h2>
            <p>
              We respect intellectual property rights. If you believe content on the Service infringes your copyright, please send a notice to the contact address below containing: (a) identification of the copyrighted work; (b) identification of the infringing material and its location on the Service; (c) your contact information; (d) a statement of good faith belief that the use is unauthorized; and (e) a statement, under penalty of perjury, that the information is accurate and you are the copyright owner or authorized to act on their behalf.
            </p>
            <p className="mt-3">
              We will process valid notices and remove infringing content as required by the Digital Millennium Copyright Act (17 U.S.C. § 512).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">9. AI Detection</h2>
            <p>
              The Service uses automated systems to detect AI-generated imagery. These systems are provided on a best-effort basis and are not guaranteed to be accurate or complete. We make no warranty that AI detection will identify all AI-generated images or that it will not produce false positives. Content moderation decisions are made at our sole discretion and are final.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. You may delete your account at any time through your account settings. Upon termination, your right to use the Service ceases immediately. Sections 4, 11, 12, 13, 14, and 16 survive termination.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">11. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm font-medium text-ink/60 tracking-wide">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THAT ANY CONTENT ON THE SERVICE IS ACCURATE, COMPLETE, OR SUITABLE FOR ANY PURPOSE.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">12. Limitation of Liability</h2>
            <p className="uppercase text-sm font-medium text-ink/60 tracking-wide">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SPARKURIO AND ITS OWNERS, OFFICERS, EMPLOYEES, AGENTS, LICENSORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="uppercase text-sm font-medium text-ink/60 tracking-wide mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS (USD $100).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">13. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Sparkurio and its owners, officers, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any third-party right, including any intellectual property or privacy right.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">14. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Kansas, without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved exclusively in the state or federal courts located in Ellsworth County, Kansas, and you consent to personal jurisdiction in those courts.
            </p>
            <p className="mt-3">
              TO THE EXTENT PERMITTED BY LAW, YOU WAIVE ANY RIGHT TO A JURY TRIAL OR TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION IN ANY DISPUTE ARISING FROM THESE TERMS OR YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">15. Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. If we make material changes, we will notify you by updating the "Last updated" date above and, where appropriate, providing additional notice. Your continued use of the Service after any changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section id="creator-terms">
            <h2 className="font-serif text-xl text-ink/80 mb-3">16. Marketplace: Paid Resources</h2>
            <p>
              <strong className="text-ink/80">(a) Marketplace Role.</strong> Certain users ("Creators") may offer resources for sale ("Paid Resources") to other users ("Buyers") through the Service. Sparkurio provides the technology platform and payment facilitation only. Sparkurio is not a party to any transaction between a Creator and a Buyer, does not take title to any Paid Resource, and does not guarantee the accuracy, quality, legality, originality, or fitness for any purpose of any Paid Resource.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(b) Creator Eligibility and Warranties.</strong> To offer Paid Resources, a Creator must complete identity verification and payment onboarding through our third-party payment processor. By listing a Paid Resource, a Creator represents and warrants that: (i) they own all right, title, and interest in the Paid Resource, or hold all rights and licenses necessary to sell and distribute it through the Service; (ii) the Paid Resource does not infringe, misappropriate, or violate any third party's intellectual property, privacy, or other rights; and (iii) all statements made about the Paid Resource (grade level, subject, standards alignment, or otherwise) are accurate. Creators are solely and fully responsible for the content of their Paid Resources and indemnify Sparkurio to the fullest extent set forth in Section 13.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(c) Payment Processing.</strong> All payments for Paid Resources are processed by Stripe, Inc. ("Stripe") through Stripe Connect. By enabling payouts, a Creator agrees to Stripe's Connected Account Agreement and any applicable Stripe terms, in addition to these Terms. Sparkurio retains a percentage of each transaction as a platform fee, disclosed to the Creator prior to enabling payouts; the remainder is transferred to the Creator by Stripe. Sparkurio does not hold, control, or have custody of Creator funds at any point; Stripe acts as the payment processor for all such transactions.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(d) No Refund Obligation.</strong> All sales of Paid Resources are final. Sparkurio has no obligation to issue, facilitate, or guarantee any refund to a Buyer. A Buyer's sole recourse for a dispute regarding a Paid Resource is directly with the Creator or, where applicable, a chargeback or dispute filed with their payment card issuer through the card network's standard dispute process. Sparkurio may, but is not obligated to, assist in resolving disputes between Creators and Buyers, and may remove a Paid Resource, suspend a Creator's ability to sell, or withhold future payouts pending investigation of any suspected fraud, infringement, or violation of these Terms, without liability to either the Creator or any Buyer for resulting losses.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(e) Tax Responsibility.</strong> Creators are solely responsible for determining, collecting (where applicable), and remitting any taxes owed on their earnings from Paid Resources. Stripe may issue applicable tax forms (e.g., Form 1099-K) directly to Creators as required by law. Sparkurio does not provide tax advice and is not responsible for any Creator's tax obligations.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(f) Removal and Termination.</strong> In addition to Sparkurio's general rights under Sections 4 and 10, Sparkurio may remove any Paid Resource, terminate a Creator's ability to sell, and/or withhold pending payouts at any time and in its sole discretion, including in response to a DMCA notice under Section 8, suspected stolen or infringing content, or a pattern of Buyer disputes or chargebacks — without any obligation to compensate the Creator for resulting losses.
            </p>
            <p className="mt-3">
              <strong className="text-ink/80">(g) Acknowledgment.</strong> By checking the applicable box and enabling payouts, a Creator affirmatively acknowledges and agrees to this Section 16 in addition to the remainder of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink/80 mb-3">17. Contact</h2>
            <p>
              Questions about these Terms may be directed to:<br />
              <a href="mailto:admin@sparkurio.com" className="text-papaya hover:text-papaya/70 transition-colors">admin@sparkurio.com</a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-ink/8 flex gap-6 text-sm text-ink/40">
          <Link href="/privacy" className="hover:text-papaya transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-papaya transition-colors">Back to Sparkurio</Link>
        </div>
      </div>
    </main>
  );
}
