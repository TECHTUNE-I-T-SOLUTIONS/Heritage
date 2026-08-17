/**
 * Professional legal copy for Heritage Club.
 *
 * These documents are drafted for a paid, live online educational service that
 * serves children in the diaspora, with parents/guardians as the contracting
 * account holders. They are written to reflect common COPPA / GDPR / PIPEDA
 * expectations. They are provided as a strong starting point and should be
 * reviewed by qualified counsel before launch.
 */

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDoc {
  slug: string
  title: string
  eyebrow: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const UPDATED = 'August 15, 2026'
const OPERATOR = 'Heritage Club, operated by Damzy Next Gen ("Heritage Club", "we", "us", or "our")'
const CONTACT = 'hello@heritageclub.app'

const terms: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  eyebrow: 'Legal',
  updated: UPDATED,
  intro:
    `These Terms of Service ("Terms") govern your access to and use of the Heritage Club website, applications, live classes, and related services (collectively, the "Service"). The Service is provided by ${OPERATOR}. By creating an account, enrolling a child, or otherwise using the Service, you agree to be bound by these Terms.`,
  sections: [
    {
      heading: '1. Eligibility and accounts',
      paragraphs: [
        'The Service is intended for children, but accounts are opened and controlled by an adult. To register as a parent or guardian you must be at least 18 years old and have the legal authority to enter into this agreement on behalf of yourself and any child you enroll.',
        'Independent students aged 13 or older may register their own account where permitted by local law; where a student is under the age of majority, a parent or guardian remains responsible for the account and for these Terms.',
        'You agree to provide accurate, current, and complete information during registration and to keep it up to date. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.',
      ],
    },
    {
      heading: '2. The Service',
      paragraphs: [
        'Heritage Club provides live, small-group and self-paced cultural education, including lessons, quizzes, creative assignments, progress tracking, and community features. Class schedules, cohort placement, curriculum, and educators may change from time to time.',
        'Cohort placement is arranged by Heritage Club staff based on a learner\'s age, availability, and cohort capacity, and is confirmed after payment. We do not guarantee placement in a specific cohort, time slot, or with a specific educator.',
      ],
    },
    {
      heading: '3. Memberships, billing, and renewals',
      paragraphs: [
        'Paid memberships are billed in advance on a recurring monthly basis at the price shown at checkout. By subscribing, you authorize us and our payment processor to charge your selected payment method for each billing cycle until you cancel.',
        'Prices are stated in the currency shown at checkout and may exclude applicable taxes. We may change membership prices with reasonable advance notice; changes take effect at your next renewal.',
        'Payments are processed by third-party payment providers. We do not store full card details on our servers. Your use of payment features is also subject to the payment provider\'s terms.',
      ],
    },
    {
      heading: '4. Cancellations and refunds',
      paragraphs: [
        'You may cancel your membership at any time from your dashboard. Cancellation stops future renewals; access continues until the end of the current paid period. Refund eligibility is described in our Refund & Cancellation Policy, which forms part of these Terms.',
      ],
    },
    {
      heading: '5. Acceptable use',
      paragraphs: ['To keep Heritage Club a safe, welcoming space for children, you and any learner on your account agree not to:'],
      bullets: [
        'Harass, bully, threaten, or demean any person, or engage in hateful, discriminatory, or abusive conduct.',
        'Share content that is unlawful, sexually explicit, violent, or otherwise inappropriate for a children\'s learning environment.',
        'Impersonate any person, misrepresent your identity or age, or attempt to access another user\'s account.',
        'Record, reproduce, redistribute, or publicly share live sessions, curriculum, or other materials without our written permission.',
        'Disrupt, probe, or attempt to gain unauthorized access to the Service or its systems.',
      ],
    },
    {
      heading: '6. Intellectual property',
      paragraphs: [
        'All curriculum, lessons, videos, graphics, text, and other materials provided through the Service are owned by Heritage Club or its licensors and are protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable, revocable license to access and use these materials for personal, non-commercial learning during your membership.',
        'Work that a learner creates and uploads (assignments, projects, recordings) remains owned by the learner or their guardian. By submitting such work you grant Heritage Club a limited license to store, display, and use it to operate the Service, provide feedback, and administer features such as moderation and progress tracking.',
      ],
    },
    {
      heading: '7. Content moderation and safety',
      paragraphs: [
        'We may review, moderate, and remove submissions or restrict accounts to protect the safety of children and the integrity of the community. We may suspend or terminate access for conduct that violates these Terms or applicable law.',
      ],
    },
    {
      heading: '8. Disclaimers and limitation of liability',
      paragraphs: [
        'The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, to the fullest extent permitted by law. We do not warrant that the Service will be uninterrupted, error-free, or that it will meet every expectation.',
        'To the maximum extent permitted by law, Heritage Club will not be liable for any indirect, incidental, special, consequential, or punitive damages, and our total liability for any claim relating to the Service will not exceed the amount you paid to us in the twelve months preceding the claim.',
      ],
    },
    {
      heading: '9. Changes and termination',
      paragraphs: [
        'We may modify these Terms from time to time. If we make material changes we will provide reasonable notice, for example by email or through the Service. Continued use after changes take effect constitutes acceptance. You may terminate at any time by cancelling and closing your account.',
      ],
    },
    {
      heading: '10. Governing law and contact',
      paragraphs: [
        'These Terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict-of-law principles, unless a mandatory local law provides otherwise.',
        `Questions about these Terms can be sent to ${CONTACT}.`,
      ],
    },
  ],
}

const privacy: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  eyebrow: 'Legal',
  updated: UPDATED,
  intro:
    `This Privacy Policy explains how ${OPERATOR} collects, uses, shares, and protects personal information when you use the Service. Because Heritage Club serves children, we take particular care with children's information and only collect it with parental involvement and consent.`,
  sections: [
    {
      heading: '1. Information we collect',
      paragraphs: ['We collect the following categories of information:'],
      bullets: [
        'Account information: parent/guardian name, email, phone number, country, time zone, and password (stored only as a secure hash).',
        'Learner information: a child\'s name or preferred name, age or date of birth, time zone, availability, cohort, and learning progress.',
        'Learning activity: lesson completions, quiz attempts, assignment submissions, achievements, and messages within the Service.',
        'Billing information: subscription plan, transaction records, and payment status. Card details are handled by our payment processor, not stored by us.',
        'Technical information: device, browser, IP address, and usage data collected through cookies and similar technologies.',
      ],
    },
    {
      heading: '2. Children\'s privacy and parental consent',
      paragraphs: [
        'Accounts are created and managed by an adult. When a parent or guardian enrolls a child, they consent to our collection and use of that child\'s information as described here. We collect only the information reasonably necessary to provide the educational Service.',
        'We do not require a child to disclose more information than is needed to participate. Parents and guardians may review their child\'s information, request corrections or deletion, and withdraw consent at any time by contacting us.',
      ],
    },
    {
      heading: '3. How we use information',
      bullets: [
        'To provide and personalize the Service, including lessons, cohorts, progress tracking, and feedback.',
        'To process payments, manage subscriptions, and send transactional messages such as receipts and class reminders.',
        'To keep the community safe through moderation and to enforce our Terms.',
        'To improve and develop the Service, and to communicate important updates.',
        'To comply with legal obligations and protect our rights and the safety of users.',
      ],
    },
    {
      heading: '4. Legal bases',
      paragraphs: [
        'Where applicable law (such as the GDPR) requires a legal basis, we rely on the performance of our contract with you, your consent (including parental consent for children), our legitimate interests in operating and improving the Service, and compliance with legal obligations.',
      ],
    },
    {
      heading: '5. How we share information',
      paragraphs: [
        'We do not sell personal information. We share information only as needed to operate the Service:',
      ],
      bullets: [
        'Service providers who process payments, host our infrastructure, or provide communication tools, under contractual confidentiality and security obligations.',
        'Educators, who see the learner information needed to teach and support their assigned cohorts.',
        'Legal and safety recipients, where disclosure is required by law or necessary to protect a child or other person.',
        'A successor entity in the event of a merger, acquisition, or reorganization, subject to this Policy.',
      ],
    },
    {
      heading: '6. Data retention',
      paragraphs: [
        'We retain personal information for as long as an account is active and as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. When information is no longer required, we delete or anonymize it.',
      ],
    },
    {
      heading: '7. Security',
      paragraphs: [
        'We use administrative, technical, and organizational measures designed to protect personal information, including encryption in transit, hashed passwords, and access controls. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
      ],
    },
    {
      heading: '8. Your rights and choices',
      paragraphs: [
        'Depending on your location, you may have rights to access, correct, delete, export, or restrict the processing of personal information, and to withdraw consent. Parents and guardians may exercise these rights on behalf of their children. To make a request, contact us using the details below; we will respond within the timeframe required by applicable law.',
      ],
    },
    {
      heading: '9. International transfers',
      paragraphs: [
        'We may process and store information in countries other than where you live. Where we transfer personal information across borders, we take steps to ensure it receives an adequate level of protection consistent with applicable law.',
      ],
    },
    {
      heading: '10. Changes and contact',
      paragraphs: [
        'We may update this Policy from time to time and will post the updated version with a new effective date. For privacy questions or to exercise your rights, contact us at ' + CONTACT + '.',
      ],
    },
  ],
}

const refund: LegalDoc = {
  slug: 'refund',
  title: 'Refund & Cancellation Policy',
  eyebrow: 'Legal',
  updated: UPDATED,
  intro:
    'This Refund & Cancellation Policy explains how memberships renew, how to cancel, and when refunds are available. It forms part of our Terms of Service.',
  sections: [
    {
      heading: '1. Monthly memberships',
      paragraphs: [
        'Memberships are billed in advance and renew automatically each month until cancelled. Each payment covers the upcoming month of access, including live sessions and curriculum for the applicable plan.',
      ],
    },
    {
      heading: '2. How to cancel',
      paragraphs: [
        'You can cancel at any time from your dashboard under Subscription. When you cancel, auto-renewal is turned off and your membership remains active until the end of the current paid period. After that date, access ends and no further charges are made.',
      ],
    },
    {
      heading: '3. Refund eligibility',
      bullets: [
        'New members: if you are dissatisfied, you may request a full refund of your first monthly payment within 7 days of that charge, provided no more than one live session has been attended.',
        'Renewals: monthly renewal charges are generally non-refundable once the new period has begun, because access and cohort scheduling are provided for the full month.',
        'Service issues: if a paid live session is cancelled by Heritage Club and not rescheduled or made up, you may request a prorated credit or refund for that session.',
        'Duplicate or erroneous charges are refunded in full upon verification.',
      ],
    },
    {
      heading: '4. How refunds are issued',
      paragraphs: [
        'Approved refunds are returned to the original payment method through our payment processor. Processing times depend on the provider and your financial institution, and typically take 5–10 business days to appear.',
      ],
    },
    {
      heading: '5. Requesting a refund',
      paragraphs: [
        `To request a refund or ask a billing question, email ${CONTACT} from the address on your account and include your name and the payment reference. We aim to respond within two business days.`,
      ],
    },
    {
      heading: '6. Statutory rights',
      paragraphs: [
        'Nothing in this Policy limits any non-waivable refund or cancellation rights you may have under the consumer-protection laws of your jurisdiction.',
      ],
    },
  ],
}

const cookies: LegalDoc = {
  slug: 'cookies',
  title: 'Cookie Policy',
  eyebrow: 'Legal',
  updated: UPDATED,
  intro:
    'This Cookie Policy explains how Heritage Club uses cookies and similar technologies when you visit our website or use the Service, and how you can manage them.',
  sections: [
    {
      heading: '1. What cookies are',
      paragraphs: [
        'Cookies are small text files stored on your device when you visit a website. Similar technologies include local storage and pixels. They help websites function, remember preferences, and understand how the site is used.',
      ],
    },
    {
      heading: '2. Cookies we use',
      bullets: [
        'Strictly necessary cookies: required to sign in and keep you securely authenticated (for example, our session cookie). The Service cannot function without these.',
        'Preference cookies: remember choices such as your light or dark theme.',
        'Analytics cookies: help us understand aggregate, non-identifying usage so we can improve the Service. These are used only where permitted and, where required, with your consent.',
      ],
    },
    {
      heading: '3. Managing cookies',
      paragraphs: [
        'Most browsers let you view, delete, and block cookies through their settings. Because our sign-in relies on a strictly necessary session cookie, blocking all cookies may prevent you from using your dashboard. Where consent is required for non-essential cookies, we will ask for it and honor your choice.',
      ],
    },
    {
      heading: '4. Third parties',
      paragraphs: [
        'Some features, such as payment processing, may set cookies controlled by third-party providers under their own policies. We encourage you to review the privacy and cookie notices of those providers.',
      ],
    },
    {
      heading: '5. Contact',
      paragraphs: [
        `Questions about our use of cookies can be sent to ${CONTACT}.`,
      ],
    },
  ],
}

const LEGAL_DOCS: Record<string, LegalDoc> = { terms, privacy, refund, cookies }

export const LEGAL_SLUGS = ['terms', 'privacy', 'refund', 'cookies'] as const
export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS[slug]
}
