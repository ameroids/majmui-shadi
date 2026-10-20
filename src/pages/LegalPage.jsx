import { useState } from 'react'
import LegalModal from '../components/LegalModal'

export default function LegalPage({ initialTab = 'terms' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-xl border border-ivory-line p-6 sm:p-10">
        <div className="flex items-center justify-between border-b border-ivory-line pb-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setTab('terms')}
              className={`text-base font-semibold transition pb-2 border-b-2 -mb-[18px] ${
                tab === 'terms'
                  ? 'border-emerald-deep text-emerald-deep'
                  : 'border-transparent text-ink/60 hover:text-ink'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setTab('privacy')}
              className={`text-base font-semibold transition pb-2 border-b-2 -mb-[18px] ${
                tab === 'privacy'
                  ? 'border-emerald-deep text-emerald-deep'
                  : 'border-transparent text-ink/60 hover:text-ink'
              }`}
            >
              Privacy Policy
            </button>
          </div>
          <a
            href="/"
            className="text-xs uppercase tracking-wider font-semibold text-emerald-deep hover:underline"
          >
            ← Back to Home
          </a>
        </div>

        <div className="text-ink/80 space-y-6 leading-relaxed">
          {tab === 'terms' ? (
            <>
              <div>
                <h2 className="text-xl font-display font-semibold text-emerald-deep mb-2">Terms and Conditions</h2>
                <p className="text-sm text-ink/60 mb-4">Last updated: March 2026</p>
                <p>
                  Welcome to the <strong>Majmui Shaadi Event Portal</strong>. By accessing or using this system, you agree to comply with and be bound by the following terms and operational conditions.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">1. Purpose & Scope</h3>
                <p>
                  This portal is provided solely for coordinating authorized Majmui Shaadi arrangements, including guest list compilation, attendance verification, meal and thaal requirements, and financial contribution tracking.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">2. User Accounts & Responsibilities</h3>
                <p>
                  Access credentials granted to Brides, Grooms, TNC members, Accounts personnel, and Administrators are personal and non-transferable. You are responsible for ensuring all entered guest details and member counts are accurate and up to date.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">3. WhatsApp Communication Guidelines</h3>
                <p>
                  The software generates personalized invitations and deep links for transmission over WhatsApp. All dispatches must be legitimate wedding invitations directed only to relevant family members. Transmission of unsolicited messages or misuse of the platform is strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">4. Single-Event Authorization & Recurring Events</h3>
                <p>
                  System access and services are provisioned strictly on a <strong>single event edition basis</strong> for the active operational duration of one edition (standard 3-month cycle). This engagement covers only the designated event. For subsequent editions (such as recurring half-yearly events), a separate service engagement and setup authorization applies for database re-initialization, new couple onboarding, and event configuration.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">5. Limitation of Liability</h3>
                <p>
                  The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. The management and technical team make every effort to maintain uptime and data integrity but are not liable for external telecom/network interruptions or user entry mistakes.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-display font-semibold text-emerald-deep mb-2">Privacy Policy</h2>
                <p className="text-sm text-ink/60 mb-4">Last updated: March 2026</p>
                <p>
                  Your privacy and the security of community data are of paramount importance. This Privacy Policy details how information is processed and safeguarded within the Majmui Shaadi software.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">1. Information We Collect</h3>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Guest Identification:</strong> Family and member names required to prepare personalized invitations and entry rosters.</li>
                  <li><strong>Event Selections:</strong> Function attendance, thaal allocations, and confirmed member headcounts.</li>
                  <li><strong>Financial & Contribution Records:</strong> Installment status and payment logs maintained by authorized accounts staff.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">2. Purpose of Processing</h3>
                <p>
                  Collected data is used solely to facilitate the smooth execution of the Majmui Shaadi wedding functions, plan catering, prevent duplicate invitations, and provide accurate attendance rosters.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">3. Confidentiality & Data Protection</h3>
                <p>
                  Data is safeguarded using industry-standard encryption, Row Level Security (RLS), and role-based permissions. Information is never monetized, sold, or shared with commercial entities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">4. Retention & Archival</h3>
                <p>
                  Personal data and guest lists are retained for the duration of the 3-month event coordination cycle and audit period, after which formal records are archived with the event committee.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-deep text-base mb-1">5. Contact</h3>
                <p>
                  For any questions or privacy inquiries regarding this system, please contact your committee administrator or IT coordinator.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Majmui Shaadi Management System • All rights reserved.
      </footer>
    </div>
  )
}
