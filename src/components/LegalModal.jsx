import { useState, useEffect } from 'react'
import Modal from './ui/Modal'

export default function LegalModal({ open, isOpen, onClose, initialTab = 'terms' }) {
  const [tab, setTab] = useState(initialTab)
  const isModalOpen = Boolean(open ?? isOpen)

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab, isModalOpen])

  return (
    <Modal open={isModalOpen} onClose={onClose} title={tab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'} size="lg">
      <div className="flex border-b border-ivory-line mb-4">
        <button
          type="button"
          onClick={() => setTab('terms')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
            tab === 'terms'
              ? 'border-emerald-deep text-emerald-deep'
              : 'border-transparent text-ink/60 hover:text-ink'
          }`}
        >
          Terms & Conditions
        </button>
        <button
          type="button"
          onClick={() => setTab('privacy')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
            tab === 'privacy'
              ? 'border-emerald-deep text-emerald-deep'
              : 'border-transparent text-ink/60 hover:text-ink'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      <div className="text-sm text-ink/80 space-y-4 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
        {tab === 'terms' ? (
          <>
            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">1. Purpose & Scope</h3>
              <p>
                The Majmui Shaadi Event Portal is provided exclusively for the coordinating committees (Anjuman-e-Saifee / TNC / Accounts) and participating brides, grooms, and invited guests to facilitate invitation distribution, attendance confirmation, thaal estimation, and account tracking for the designated Majmui Shaadi event.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">2. Authorized Use & Account Security</h3>
              <p>
                Users are assigned unique credentials based on their role (Bride, Groom, Admin, TNC, Accounts). You agree to keep your credentials confidential and immediately notify administrators of any unauthorized access. You may only manage data and invitations pertinent to your family or authorized operational tasks.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">3. WhatsApp Invitation Guidelines</h3>
              <p>
                The platform prepares invitation messages and deep links for transmission over WhatsApp. All messages dispatched using the platform must be legitimate invitations addressed to designated family representatives and adhere to respectful communication standards. The software does not transmit unsolicited spam.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">4. Service Validity & Event-Specific Licensing</h3>
              <p>
                Access to this software and its dashboards is authorized strictly for a <strong>single event edition</strong> (the active 3-month operational cycle covering pre-event preparations, invitation drive, event days, and post-event reporting). This authorization is specific to the current event and concludes upon event completion. For subsequent or recurring Majmui Shaadi editions (such as future half-yearly events), a separate service agreement and re-deployment authorization is required to reactivate the platform, onboard new couples, and configure new event databases.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">5. Limitation of Liability</h3>
              <p>
                The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis for community event coordination. While every measure is taken to ensure uninterrupted availability and data precision, the organizers and technical developers shall not be liable for third-party network failures, telecommunications or WhatsApp outages, or typographical input errors by users.
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">1. Information We Collect</h3>
              <p>
                To coordinate community wedding arrangements and logistics, the platform processes:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Guest Identification:</strong> Family and member names required to prepare personalized invitations and event entry rosters.</li>
                <li><strong>RSVP & Function Selections:</strong> Function attendance, thaal allocations, and confirmed headcount responses.</li>
                <li><strong>Financial Accounting:</strong> Event contribution schedules and records maintained for registered couples.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">2. How Information is Used</h3>
              <p>
                Processed data is used strictly for:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Generating personalized event invitations and RSVP acknowledgments.</li>
                <li>Accurate catering and thaal estimations for TNC and venue managers.</li>
                <li>Roster verification and security check-in at event venues.</li>
                <li>Accounts reconciliation by authorized finance personnel.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">3. Data Protection & Confidentiality</h3>
              <p>
                All event coordination data is stored in secure, access-controlled databases with Row Level Security (RLS) enforcement. No personal data or guest rosters are sold, rented, or shared with third-party commercial entities.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">4. Data Retention</h3>
              <p>
                Information is retained for the duration of the event lifecycle and necessary audit/reconciliation procedures, after which final rosters are exported for archival by the organizing committee.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-deep text-base mb-1">5. Contact & Inquiries</h3>
              <p>
                For questions regarding data records, updates, or privacy matters, please contact your Majmui Shaadi Event Coordinator or Jamaat Technical Administration.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 pt-3 border-t border-ivory-line flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-emerald-deep text-ivory text-sm font-semibold rounded-lg hover:bg-emerald-deep/90 transition"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
